import { sql, eq, getTableColumns } from "drizzle-orm";
import type { SegmentJson, TokenStreamJson } from "../sharedTypes";
import { messageSegmentsTable, messageTable, messageTokensTable } from "$lib/client/db/schema";
import type { ClientDBType } from "$lib/client/db/index.svelte";

/**
 * Creates a base query for fetching messages with their segments and token streams
 */
export function createMessagesBaseQuery<DBT extends ClientDBType>(db: DBT) {
  const segmentsSubquery = db
    .select({
      segments: sql<SegmentJson>`jsonb_agg(jsonb_build_object(
							'ordinal', ${messageSegmentsTable}.ordinal,
							'kind',    ${messageSegmentsTable}.kind,
							'content', ${messageSegmentsTable}.content,
							'toolName',${messageSegmentsTable}.toolName,
							'toolArgs',${messageSegmentsTable}.toolArgs,
							'toolResult', ${messageSegmentsTable}.toolResult
						) ORDER BY ${messageSegmentsTable}.ordinal)`.as("segments"),
    })
    .from(messageSegmentsTable)
    .where(eq(messageSegmentsTable.messageId, messageTable.id))
    .as("segments");

  const tokenStreamSubquery = db
    .select({
      tokenStream: sql<TokenStreamJson[]>`jsonb_agg(jsonb_build_object(
								'token', ${messageTokensTable}.tokens,
								'kind', ${messageTokensTable}.kind
							) ORDER BY ${messageTokensTable}.createdAt)`.as("tokenStream"),
    })
    .from(messageTokensTable)
    .where(eq(messageTokensTable.messageId, messageTable.id))
    .as("tokenStream");

  return {
    baseQuery: db
      .select({
        ...getTableColumns(messageTable),
        segments: segmentsSubquery.segments,
        tokenStream: tokenStreamSubquery.tokenStream,
      })
      .from(messageTable)
      .leftJoinLateral(segmentsSubquery, sql<boolean>`true`)
      .leftJoinLateral(tokenStreamSubquery, sql<boolean>`true`),
    segmentsSubquery,
    tokenStreamSubquery,
  };
}
