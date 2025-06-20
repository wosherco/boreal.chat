import { desc, eq, sql } from "drizzle-orm";
import { clientDb } from "./index.svelte";
import { chatTable, messageSegmentsTable, messageTable } from "./schema";

export async function searchChats(query: string) {
  const chats = await clientDb()
    .select({
      id: chatTable.id,
      title: chatTable.title,
      rank: sql`ts_rank(
        setweight(to_tsvector('english', ${chatTable.title}), 'A') ||
        setweight(to_tsvector('english', ${messageSegmentsTable.content}), 'B')
      )`,
      segmentContent: messageSegmentsTable.content,
    })
    .from(chatTable)
    .innerJoin(messageTable, eq(chatTable.id, messageTable.chatId))
    .innerJoin(messageSegmentsTable, eq(messageTable.id, messageSegmentsTable.messageId))
    .where(
      sql`setweight(to_tsvector('english', ${chatTable.title}), 'A') ||
      setweight(to_tsvector('english', ${messageSegmentsTable.content}), 'B')
      ) @@ to_tsquery('english', ${query})`,
    )
    .orderBy((t) => desc(t.rank))
    .limit(10);

  return chats;
}
