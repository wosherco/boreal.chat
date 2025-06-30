import { eq } from "drizzle-orm";
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

export async function createMessageShare(
  userId: string,
  messageId: string,
  privacy: SharePrivacy,
  emails: string[] = [],
) {
  const [msg] = await db
    .select({
      chatId: messageTable.chatId,
      threadId: messageTable.threadId,
      userId: messageTable.userId,
    })
    .from(messageTable)
    .where(eq(messageTable.id, messageId))
    .limit(1);

  if (!msg || msg.userId !== userId) {
    throw new Error("Message not found");
  }

  const id = nanoid();
  await db.insert(messageShareTable).values({
    id,
    userId,
    chatId: msg.chatId,
    threadId: msg.threadId,
    messageId,
    privacy,
    allowedEmails: emails,
  });
  return { id };
}

export async function createThreadShare(
  userId: string,
  threadId: string,
  lastMessageId: string,
  privacy: SharePrivacy,
  emails: string[] = [],
) {
  const [thread] = await db
    .select({ chatId: threadTable.chatId, userId: threadTable.userId })
    .from(threadTable)
    .where(eq(threadTable.id, threadId))
    .limit(1);

  if (!thread || thread.userId !== userId) {
    throw new Error("Thread not found");
  }

  const id = nanoid();
  await db.insert(threadShareTable).values({
    id,
    userId,
    chatId: thread.chatId,
    threadId,
    lastMessageId,
    privacy,
    allowedEmails: emails,
  });
  return { id };
}

export async function createChatShare(
  userId: string,
  chatId: string,
  privacy: SharePrivacy,
  emails: string[] = [],
) {
  const [chat] = await db
    .select({ userId: chatTable.userId })
    .from(chatTable)
    .where(eq(chatTable.id, chatId))
    .limit(1);

  if (!chat || chat.userId !== userId) {
    throw new Error("Chat not found");
  }

  const [existing] = await db
    .select()
    .from(chatShareTable)
    .where(eq(chatShareTable.chatId, chatId))
    .limit(1);

  if (existing) {
    await db
      .update(chatShareTable)
      .set({ privacy, allowedEmails: emails, updatedAt: new Date() })
      .where(eq(chatShareTable.chatId, chatId));
  } else {
    await db.insert(chatShareTable).values({
      chatId,
      userId,
      privacy,
      allowedEmails: emails,
    });
  }

  return { chatId };
}
