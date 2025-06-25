import { and, eq, isNull, sql } from "drizzle-orm";
import type { TransactableDBType } from "../db";
import { chatTable, messageSegmentsTable, messageTable, threadTable } from "../db/schema";
import type { MessageChainRow } from "$lib/common/sharedTypes";
import { transformKeyToCamelCaseRecursive } from "$lib/client/hooks/utils";
import type { ModelId } from "$lib/common/ai/models";
import { addSeconds } from "date-fns";
import { alias } from "drizzle-orm/pg-core";

export async function createChat(
  tx: TransactableDBType,
  userId: string,
  params: {
    model: (typeof chatTable.$inferSelect)["selectedModel"];
    webSearchEnabled: (typeof chatTable.$inferSelect)["webSearchEnabled"];
    reasoningLevel: (typeof chatTable.$inferSelect)["reasoningLevel"];
  },
) {
  const [chat] = await tx
    .insert(chatTable)
    .values({
      userId,
      selectedModel: params.model,
      webSearchEnabled: params.webSearchEnabled,
      reasoningLevel: params.reasoningLevel,
    })
    .returning({
      id: chatTable.id,
    });

  if (!chat) {
    throw new Error("Failed to create chat");
  }

  const [thread] = await tx
    .insert(threadTable)
    .values({
      userId,
      chatId: chat.id,
    })
    .returning({
      id: threadTable.id,
    });

  if (!thread) {
    throw new Error("Failed to create thread");
  }

  return {
    chatId: chat.id,
    threadId: thread.id,
  };
}

export async function findAndUpdateChat(
  tx: TransactableDBType,
  chatId: string,
  userId: string,
  params: {
    model?: (typeof chatTable.$inferSelect)["selectedModel"];
    webSearchEnabled?: (typeof chatTable.$inferSelect)["webSearchEnabled"];
    reasoningLevel?: (typeof chatTable.$inferSelect)["reasoningLevel"];
  },
) {
  const [chat] = await tx
    .update(chatTable)
    .set({
      ...params,
      updatedAt: new Date(),
    })
    .where(and(eq(chatTable.id, chatId), eq(chatTable.userId, userId)))
    .returning();

  if (!chat) {
    throw new Error("Chat not found");
  }

  return chat;
}

export async function markMessageAsErrored(
  tx: TransactableDBType,
  messageId: string,
  error: string,
) {
  await tx
    .update(messageTable)
    .set({
      status: "error",
      error,
    })
    .where(eq(messageTable.id, messageId));
}

export async function createUserMessageAndStartAssistantMessage(
  tx: TransactableDBType,
  params: {
    model: ModelId;
    userId: string;
    chatId: string;
    threadId: string;
    parentMessageId?: string;
    message: string;
  },
) {
  const { userId, chatId, threadId, parentMessageId, message, model } = params;

  const userMessageCreated = new Date();
  const assistantMessageCreated = addSeconds(userMessageCreated, 1);

  const [userMessage] = await tx
    .insert(messageTable)
    .values({
      userId,
      chatId,
      threadId,
      version: 1,
      role: "user",
      status: "finished",
      parentMessageId: parentMessageId,
      model: model,
      createdAt: userMessageCreated,
    })
    .returning();

  if (!userMessage) {
    throw new Error("Failed to create message");
  }

  const [[assistantMessage]] = await Promise.all([
    tx
      .insert(messageTable)
      .values({
        userId,
        chatId,
        threadId,
        parentMessageId: userMessage.id,
        role: "assistant",
        model: model,
        createdAt: assistantMessageCreated,
      })
      .returning({
        id: messageTable.id,
      })
      .execute(),
    tx
      .insert(messageSegmentsTable)
      .values({
        userId,
        messageId: userMessage.id,
        ordinal: 1,
        kind: "text",
        content: message,
      })
      .execute(),
  ]);

  if (!assistantMessage) {
    throw new Error("Failed to create assistant message");
  }

  return {
    userMessage,
    assistantMessageId: assistantMessage.id,
  };
}

export async function createReplyUserMessageAndAssistantMessage(
  tx: TransactableDBType,
  params: {
    chatId: string;
    userId: string;
    parentMessageId: string | null;
    message: string;
    model: ModelId;
  },
) {
  const isUpdatingFirstMessage = params.parentMessageId === null;

  const userMessageCreated = new Date();
  const assistantMessageCreated = addSeconds(userMessageCreated, 1);

  const [[parentMessage], childMessagesCount] = await Promise.all([
    // With this query we're checking that the user has access to this chat
    tx
      .select()
      .from(messageTable)
      .where(
        and(
          eq(messageTable.userId, params.userId),
          params.parentMessageId
            ? eq(messageTable.id, params.parentMessageId)
            : isNull(messageTable.parentMessageId),
          eq(messageTable.chatId, params.chatId),
        ),
      )
      .execute(),
    tx.$count(
      messageTable,
      and(
        eq(messageTable.userId, params.userId),
        params.parentMessageId
          ? eq(messageTable.parentMessageId, params.parentMessageId)
          : isNull(messageTable.parentMessageId),
        eq(messageTable.chatId, params.chatId),
      ),
    ),
  ]);

  // Should we also check the user is editing a user message? Or should we let script kiddies think they're super hackers doing that? At the end of the day it's their chat, no?
  if (!parentMessage) {
    throw new Error("Parent message not found");
  }

  const threadId =
    childMessagesCount === 0 && !isUpdatingFirstMessage
      ? parentMessage.threadId
      : await tx
          .insert(threadTable)
          .values({
            userId: params.userId,
            chatId: parentMessage.chatId,
          })
          .returning({
            id: threadTable.id,
          })
          .then(([thread]) => thread.id);

  const [insertedMessage] = await tx
    .insert(messageTable)
    .values({
      userId: params.userId,
      chatId: parentMessage.chatId,
      threadId,
      parentMessageId: params.parentMessageId,
      role: "user",
      status: "finished",
      version: childMessagesCount + 1,
      model: params.model,
      createdAt: userMessageCreated,
    })
    .returning({
      id: messageTable.id,
    });

  if (!insertedMessage) {
    throw new Error("Failed to create message");
  }

  const [[assistantMessage]] = await Promise.all([
    tx
      .insert(messageTable)
      .values({
        userId: params.userId,
        chatId: parentMessage.chatId,
        threadId,
        parentMessageId: insertedMessage.id,
        role: "assistant",
        status: "processing",
        version: 1,
        model: params.model,
        createdAt: assistantMessageCreated,
      })
      .returning({
        id: messageTable.id,
      }),
    tx
      .insert(messageSegmentsTable)
      .values({
        userId: params.userId,
        messageId: insertedMessage.id,
        ordinal: 1,
        kind: "text",
        content: params.message,
      })
      .returning(),
  ]);

  if (!assistantMessage) {
    throw new Error("Failed to create assistant message");
  }

  return {
    threadId,
    chatId: parentMessage.chatId,
    userMessageId: insertedMessage.id,
    assistantMessageId: assistantMessage.id,
  };
}

export async function regenerateMessage(
  tx: TransactableDBType,
  params: {
    userId: string;
    messageId: string;
    model: ModelId;
  },
) {
  const parent = alias(messageTable, "parent");

  const [message] = await tx
    .select({
      chatId: messageTable.chatId,
      threadId: messageTable.threadId,
      parent: {
        id: parent.id,
        threadId: parent.threadId,
      },
      model: messageTable.model,
      webSearchEnabled: messageTable.webSearchEnabled,
      reasoningLevel: messageTable.reasoningLevel,
      role: messageTable.role,
    })
    .from(messageTable)
    .leftJoin(parent, eq(messageTable.parentMessageId, parent.id))
    .where(and(eq(messageTable.id, params.messageId), eq(messageTable.userId, params.userId)))
    .execute();

  if (!message) {
    throw new Error("Message not found");
  }

  if (!message.parent?.id || message.role === "user") {
    throw new Error("Message can not be a root/user message");
  }

  const [[newThread], messagesCount] = await Promise.all([
    tx
      .insert(threadTable)
      .values({
        userId: params.userId,
        chatId: message.chatId,
      })
      .returning({
        id: threadTable.id,
      })
      .execute(),
    tx.$count(
      messageTable,
      and(
        eq(messageTable.userId, params.userId),
        eq(messageTable.parentMessageId, message.parent.id),
      ),
    ),
  ]);

  if (!newThread) {
    throw new Error("Failed to create thread");
  }

  const [newMessage] = await tx
    .insert(messageTable)
    .values({
      userId: params.userId,
      chatId: message.chatId,
      threadId: newThread.id,
      parentMessageId: message.parent.id,
      role: "assistant",
      status: "processing",
      version: messagesCount + 1,
      model: params.model,
      webSearchEnabled: message.webSearchEnabled,
      reasoningLevel: message.reasoningLevel,
    })
    .returning({
      id: messageTable.id,
      chatId: messageTable.chatId,
      threadId: messageTable.threadId,
      parentMessageId: messageTable.parentMessageId,
      model: messageTable.model,
      webSearchEnabled: messageTable.webSearchEnabled,
      reasoningLevel: messageTable.reasoningLevel,
    })
    .execute();

  if (!newMessage) {
    throw new Error("Failed to create message");
  }

  return {
    message: newMessage,
    parentMessage: {
      id: message.parent.id,
      threadId: message.parent.threadId,
    },
  };
}

export async function fetchThreadMessagesRecursive(
  db: TransactableDBType,
  threadId: string,
  parameters: {
    /**
     * If not provided, the query will start from the newest message in the thread.
     */
    lastMessageId?: string;
    /**
     * If not provided, the query will go as deep as possible. Hard limit of 100.
     */
    maxDepth?: number;
  } = {},
) {
  const depth = Math.max(Math.min(parameters.maxDepth ?? 100, 100), 1);

  const query = sql`WITH RECURSIVE seed AS (
    /* pick the newest message in the thread */
    SELECT *
    FROM   messages
    WHERE  thread_id = ${threadId}`.append(
    parameters.lastMessageId ? sql` AND id = ${parameters.lastMessageId}` : sql``,
  ).append(sql`
    ORDER  BY created_at DESC
    LIMIT  1
),
chain AS (                               -- <<< walk the parent chain
    SELECT m.*, 1 AS depth
    FROM   seed       s
    JOIN   messages   m ON m.id = s.id

    UNION ALL

    SELECT p.*, depth + 1
    FROM   messages p
    JOIN   chain     c ON p.id = c.parent_message_id
    WHERE  depth < ${depth}        -- stop after n hops
)
SELECT
    c.*,                          -- all message columns
    segs.segments,                -- aggregated segments (may be NULL)
    toks.tokenStream             -- aggregated token stream (may be NULL)
FROM   chain c
/* —— pull in message_segments as ONE row per message —— */
LEFT  JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object(
                          'ordinal', ms.ordinal,
                          'kind',    ms.kind,
                          'content', ms.content,
                          'toolName',ms.tool_name,
                          'toolArgs',ms.tool_args,
                          'toolResult', ms.tool_result
                       ) ORDER BY ms.ordinal) AS segments
        FROM   message_segments ms
        WHERE  ms.message_id = c.id
) segs ON TRUE
/* —— pull in message_tokens (if the message is still streaming) —— */
LEFT  JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object(
                          'token', mt.tokens,
                          'kind', mt.kind
                       ) ORDER BY mt.created_at)
               AS tokenStream
        FROM   message_tokens mt
        WHERE  mt.message_id = c.id
) toks ON TRUE
ORDER BY c.created_at DESC;        -- newest → oldest for chat view
`);

  const result = await db.execute<MessageChainRow>(query);

  return result
    .map((row) => ({
      ...(transformKeyToCamelCaseRecursive(row) as unknown as MessageChainRow),
      segments: row.segments ?? null,
      tokenStream: row.tokenStream ?? null,
    }))
    .toReversed();
}
