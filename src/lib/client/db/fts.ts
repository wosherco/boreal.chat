import { desc, eq, sql } from "drizzle-orm";
import { chatTable, messageSegmentsTable, messageTable } from "./schema";
import { getDbInstance } from "./index.svelte";

const weighedTitle = sql`setweight(to_tsvector('english', ${chatTable.title}), 'A')`;
const weighedContent = sql`setweight(to_tsvector('english', ${messageSegmentsTable.content}), 'B')`;

export async function searchChats(query: string) {
  const dbInstance = getDbInstance();

  if (!dbInstance) {
    throw new Error("Database not initialized");
  }

  await dbInstance.waitForReady;

  const tsQuery = sql`to_tsquery('english', ${query})`;

  const rankedMessagesSubquery = dbInstance.drizzle
    .select({
      chatId: chatTable.id,
      messageId: sql<string>`${messageTable.id}`.as("messageId"),
      threadId: messageTable.threadId,
      title: chatTable.title,
      segmentContent: messageSegmentsTable.content,
      rank: sql`ts_rank(
        (${weighedTitle} || ${weighedContent}), ${tsQuery}
      )`.as("rank"),
    })
    .from(chatTable)
    .innerJoin(messageTable, eq(chatTable.id, messageTable.chatId))
    .innerJoin(messageSegmentsTable, eq(messageTable.id, messageSegmentsTable.messageId))
    .where(sql`(${weighedTitle} || ${weighedContent}) @@ ${tsQuery}`)
    .orderBy((t) => desc(t.rank))
    .as("ranked_messages");

  const bestPerChat = dbInstance.drizzle
    .select({
      chatId: rankedMessagesSubquery.chatId,
      messageId: rankedMessagesSubquery.messageId,
      threadId: rankedMessagesSubquery.threadId,
      title: rankedMessagesSubquery.title,
      segmentContent: rankedMessagesSubquery.segmentContent,
      rank: rankedMessagesSubquery.rank,
      rn: sql`ROW_NUMBER() OVER (
      PARTITION BY ${rankedMessagesSubquery.chatId}
      ORDER BY ${rankedMessagesSubquery.rank} DESC
    )`.as("rn"),
    })
    .from(rankedMessagesSubquery)
    .as("best_per_chat");

  const chats = await dbInstance.drizzle
    .select({
      chatId: bestPerChat.chatId,
      messageId: bestPerChat.messageId,
      threadId: bestPerChat.threadId,
      title: bestPerChat.title,
      segmentContent: bestPerChat.segmentContent,
      rank: bestPerChat.rank,
    })
    .from(bestPerChat)
    .where(eq(bestPerChat.rn, 1))
    .orderBy(desc(bestPerChat.rank))
    .limit(10);

  return chats;
}
