import { sql, desc, eq } from "drizzle-orm";
import { clientDb } from "./index.svelte";
import { chatTable, messageTable, messageSegmentsTable } from "./schema";
import { transformKeyToCamelCaseRecursive } from "../hooks/utils";
import type { Chat } from "$lib/common/sharedTypes";

export async function searchChats(term: string): Promise<Chat[]> {
  const cdb = clientDb();
  const score = sql<number>`GREATEST(similarity(${chatTable.title}, ${term}), MAX(similarity(${messageSegmentsTable.content}, ${term})))`;

  const result = await cdb
    .select({
      id: chatTable.id,
      title: chatTable.title,
      created_at: chatTable.createdAt,
      updated_at: chatTable.updatedAt,
      score: score.as("score"),
    })
    .from(chatTable)
    .leftJoin(messageTable, eq(messageTable.chatId, chatTable.id))
    .leftJoin(messageSegmentsTable, eq(messageSegmentsTable.messageId, messageTable.id))
    .where(sql`(${chatTable.title} % ${term}) OR (${messageSegmentsTable.content} % ${term})`)
    .groupBy(chatTable.id)
    .orderBy(desc(score))
    .limit(10);

  return result.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { score: _score, ...chat } = row;
    return transformKeyToCamelCaseRecursive(chat) as Chat;
  });
}
