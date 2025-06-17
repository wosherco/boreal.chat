import { db } from "$lib/server/db";
import { chatTable, messageTable } from "$lib/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import { error, redirect } from "@sveltejs/kit";
import { fetchThreadMessagesRecursive } from "$lib/server/services/messages";
import type { ChatWithSettings } from "$lib/common/sharedTypes";

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) {
    throw redirect(302, "/auth");
  }

  const { chatId } = params;

  // Getting the last message in the chat
  const [lastMessageInfo] = await db
    .select({
      latestThreadId: messageTable.threadId,
      lastMessage: {
        messageId: messageTable.id,
        threadId: messageTable.threadId,
      },
      chat: {
        id: chatTable.id,
        title: chatTable.title,
        createdAt: chatTable.createdAt,
        updatedAt: chatTable.updatedAt,
        selectedModel: chatTable.selectedModel,
        webSearchEnabled: chatTable.webSearchEnabled,
        reasoningLevel: chatTable.reasoningLevel,
      },
    })
    .from(messageTable)
    .innerJoin(chatTable, eq(messageTable.chatId, chatTable.id))
    .where(and(eq(messageTable.chatId, chatId), eq(messageTable.userId, locals.user.id)))
    .orderBy(desc(messageTable.createdAt))
    .limit(1);

  if (!lastMessageInfo) {
    throw error(404, "Chat not found");
  }

  const messages = fetchThreadMessagesRecursive(db, lastMessageInfo.latestThreadId, {
    maxDepth: 10,
  });

  return {
    lastMessages: messages,
    lastMessage: lastMessageInfo.lastMessage,
    chatId,
    chat: lastMessageInfo.chat satisfies ChatWithSettings,
  };
};
