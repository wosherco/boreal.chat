import type {
  MessageWithOptionalChainRow,
  SegmentJson,
  ServerData,
} from "$lib/common/sharedTypes";
import { eq, getTableColumns, sql } from "drizzle-orm";
import { clientDb } from "../db/index.svelte";
import { messageTable, messageSegmentsTable } from "../db/schema";
import { createHydratableData } from "./localDbHook";
import { transformKeyToCamelCaseRecursive } from "./utils";

export const useChatMessages = (
  chatId: string,
  serverData: ServerData<MessageWithOptionalChainRow[]>,
) =>
  createHydratableData<MessageWithOptionalChainRow[], string>(
    {
      key: "chat-messages",
      query: (chatId) => {
        const cdb = clientDb();

        const segmentsSubquery = cdb
          .select({
            segments: sql<SegmentJson[]>`jsonb_agg(jsonb_build_object(
							'ordinal', ${messageSegmentsTable.ordinal},
							'kind',    ${messageSegmentsTable.kind},
							'content', ${messageSegmentsTable.content},
							'toolName',${messageSegmentsTable.toolName},
							'toolArgs',${messageSegmentsTable.toolArgs},
							'toolResult', ${messageSegmentsTable.toolResult}
						) ORDER BY ${messageSegmentsTable.ordinal})`.as("segments"),
          })
          .from(messageSegmentsTable)
          .where(eq(messageSegmentsTable.messageId, messageTable.id))
          .as("segments");
        return cdb
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
          tokenStream: null,
        })) satisfies MessageWithOptionalChainRow[],
    },
    serverData,
    chatId,
  );
