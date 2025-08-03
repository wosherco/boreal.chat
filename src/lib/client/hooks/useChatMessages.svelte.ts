import type { MessageWithOptionalChainRow, SegmentJson, ServerData } from "$lib/common/sharedTypes";
import { eq, getTableColumns, sql } from "drizzle-orm";
import { messageTable, messageSegmentsTable } from "../db/schema";
import { createHydratableData } from "./localDbHook";
import { transformKeyToCamelCaseRecursive } from "./utils";

export const useChatMessages = (
  serverData: ServerData<MessageWithOptionalChainRow[]>,
  chatId: () => string,
) =>
  createHydratableData<MessageWithOptionalChainRow[], string>(
    {
      key: "chat-messages",
      query: (db, chatId) => {
        const segmentsSubquery = db
          .select({
            segments: sql<SegmentJson[]>`jsonb_agg(jsonb_build_object(
							'ordinal', ${messageSegmentsTable.ordinal},
							'kind',    ${messageSegmentsTable.kind},
							'content', ${messageSegmentsTable.content},
							'toolName',${messageSegmentsTable.toolName},
							'toolArgs',${messageSegmentsTable.toolArgs},
							'toolResult', ${messageSegmentsTable.toolResult},
              'streaming', ${messageSegmentsTable.streaming}
						) ORDER BY ${messageSegmentsTable.ordinal})`.as("segments"),
          })
          .from(messageSegmentsTable)
          .where(eq(messageSegmentsTable.messageId, messageTable.id))
          .as("segments");

        return db
          .select({
            ...getTableColumns(messageTable),
            segments: segmentsSubquery.segments,
          })
          .from(messageTable)
          .leftJoinLateral(segmentsSubquery, sql<boolean>`true`)
          .where(eq(messageTable.chatId, chatId))
          .toSQL();
      },
      transform: (rows) =>
        (
          rows as (typeof messageTable.$inferSelect & {
            segments: SegmentJson[];
          })[]
        ).map((row) => ({
          ...(transformKeyToCamelCaseRecursive(row) as typeof messageTable.$inferSelect),
          segments: row.segments ?? null,
        })) satisfies MessageWithOptionalChainRow[],
    },
    serverData,
    chatId,
  );
