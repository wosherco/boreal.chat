import { and, eq } from "drizzle-orm";
import { db } from "$lib/server/db";
import {
  chatTable,
  messageTable,
  threadTable,
  messageShareTable,
  threadShareTable,
  chatShareTable,
} from "$lib/server/db/schema";
import { nanoid } from "nanoid";
import type { SharePrivacy } from "$lib/common";
import { ORPCError } from "@orpc/client";
import { cleanEmail } from "$lib/utils/email";

/**
 * Validates if a user has access to a share based on privacy settings
 */
function validateShareAccess(
  share: { privacy: SharePrivacy; allowedEmails: string[] },
  userEmail?: string,
) {
  if (!share) {
    throw new ORPCError("NOT_FOUND", {
      message: "Share not found",
    });
  }

  if (share.privacy === "private") {
    throw new ORPCError("NOT_FOUND", {
      message: "Share not found",
    });
  }

  if (share.privacy === "emails") {
    if (!userEmail || !share.allowedEmails.includes(cleanEmail(userEmail))) {
      throw new ORPCError("NOT_FOUND", {
        message: "Share not found",
      });
    }
  }

  return true;
}

export async function createMessageShare(
  userId: string,
  params: {
    chatId: string;
    existingShareId?: string;
    messageId: string;
    privacy: SharePrivacy;
    emails?: string[];
  },
) {
  const { chatId, existingShareId, messageId, privacy, emails = [] } = params;

  const [msg] = await db
    .select({
      userId: messageTable.userId,
      chatId: messageTable.chatId,
    })
    .from(messageTable)
    .where(eq(messageTable.id, messageId))
    .limit(1);

  if (!msg || msg.userId !== userId || msg.chatId !== chatId) {
    throw new ORPCError("NOT_FOUND", {
      message: "Message not found",
    });
  }

  const id = existingShareId ?? nanoid(21);
  await db
    .insert(messageShareTable)
    .values({
      id,
      userId,
      chatId,
      messageId,
      privacy,
      allowedEmails: emails.map(cleanEmail),
    })
    .onConflictDoUpdate({
      target: messageShareTable.id,
      set: {
        privacy,
        allowedEmails: emails.map(cleanEmail),
      },
      where: eq(messageShareTable.userId, userId),
    });
  return { id };
}

export async function getMessageShare(id: string, userEmail?: string) {
  const [share] = await db
    .select({
      privacy: messageShareTable.privacy,
      allowedEmails: messageShareTable.allowedEmails,
      messageId: messageShareTable.messageId,
    })
    .from(messageShareTable)
    .where(eq(messageShareTable.id, id))
    .limit(1);

  if (!share) {
    throw new ORPCError("NOT_FOUND", {
      message: "Share not found",
    });
  }

  validateShareAccess(share, userEmail);

  return {
    privacy: share.privacy,
    messageId: share.messageId,
  };
}

export async function deleteMessageShare(userId: string, id: string) {
  const [deleted] = await db
    .delete(messageShareTable)
    .where(and(eq(messageShareTable.id, id), eq(messageShareTable.userId, userId)))
    .returning({ id: messageShareTable.id });

  if (!deleted) {
    throw new ORPCError("NOT_FOUND", {
      message: "Share not found",
    });
  }
}

export async function createThreadShare(
  userId: string,
  params: {
    chatId: string;
    existingShareId?: string;
    threadId: string;
    lastMessageId: string;
    privacy: SharePrivacy;
    emails?: string[];
  },
) {
  const { chatId, existingShareId, threadId, lastMessageId, privacy, emails = [] } = params;

  const [thread] = await db
    .select({ userId: threadTable.userId, chatId: threadTable.chatId })
    .from(threadTable)
    .where(eq(threadTable.id, threadId))
    .limit(1);

  if (!thread || thread.userId !== userId || thread.chatId !== chatId) {
    throw new ORPCError("NOT_FOUND", {
      message: "Thread not found",
    });
  }

  const id = existingShareId ?? nanoid(21);
  await db
    .insert(threadShareTable)
    .values({
      id,
      userId,
      chatId,
      threadId,
      lastMessageId,
      privacy,
      allowedEmails: emails.map(cleanEmail),
    })
    .onConflictDoUpdate({
      target: threadShareTable.id,
      set: {
        privacy,
        allowedEmails: emails.map(cleanEmail),
      },
      where: eq(threadShareTable.userId, userId),
    });

  return { id };
}

export async function getThreadShare(id: string, userEmail?: string) {
  const [share] = await db
    .select({
      privacy: threadShareTable.privacy,
      allowedEmails: threadShareTable.allowedEmails,
      threadId: threadShareTable.threadId,
      lastMessageId: threadShareTable.lastMessageId,
    })
    .from(threadShareTable)
    .where(eq(threadShareTable.id, id))
    .limit(1);

  if (!share) {
    throw new ORPCError("NOT_FOUND", {
      message: "Share not found",
    });
  }

  validateShareAccess(share, userEmail);

  return {
    threadId: share.threadId,
    lastMessageId: share.lastMessageId,
  };
}

export async function deleteThreadShare(userId: string, id: string) {
  const [deleted] = await db
    .delete(threadShareTable)
    .where(and(eq(threadShareTable.id, id), eq(threadShareTable.userId, userId)))
    .returning({ id: threadShareTable.id });

  if (!deleted) {
    throw new ORPCError("NOT_FOUND", {
      message: "Share not found",
    });
  }
}

export async function upsertChatShare(
  userId: string,
  params: {
    chatId: string;
    privacy: SharePrivacy;
    emails?: string[];
  },
) {
  const { chatId, privacy, emails = [] } = params;

  const [chat] = await db
    .select({ userId: chatTable.userId, id: chatTable.id })
    .from(chatTable)
    .where(eq(chatTable.id, chatId))
    .limit(1);

  if (!chat || chat.userId !== userId || chat.id !== chatId) {
    throw new ORPCError("NOT_FOUND", {
      message: "Chat not found",
    });
  }

  await db
    .insert(chatShareTable)
    .values({
      chatId,
      userId,
      privacy,
      allowedEmails: emails.map(cleanEmail),
    })
    .onConflictDoUpdate({
      target: chatShareTable.chatId,
      set: {
        privacy,
        allowedEmails: emails.map(cleanEmail),
      },
      where: eq(chatShareTable.userId, userId),
    });

  return { chatId };
}

export async function getChatShare(id: string, userEmail?: string) {
  const [share] = await db
    .select({
      privacy: chatShareTable.privacy,
      allowedEmails: chatShareTable.allowedEmails,
      chatId: chatShareTable.chatId,
    })
    .from(chatShareTable)
    .where(eq(chatShareTable.chatId, id))
    .limit(1);

  if (!share) {
    throw new ORPCError("NOT_FOUND", {
      message: "Share not found",
    });
  }

  validateShareAccess(share, userEmail);

  return {
    chatId: share.chatId,
  };
}
