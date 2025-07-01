import type {
  MessageWithOptionalChainRow,
  SegmentJson,
  ServerData,
  TokenStreamJson,
} from "$lib/common/sharedTypes";
import { eq } from "drizzle-orm";
import { clientDb } from "../db/index.svelte";
import { messageTable } from "../db/schema";
import { createHydratableData } from "./localDbHook";
import { transformKeyToCamelCaseRecursive } from "./utils";
import { createMessagesBaseQuery } from "$lib/common/schema/queries";

export const useChatMessages = (
  chatId: string,
  serverData: ServerData<MessageWithOptionalChainRow[]>,
) =>
  createHydratableData<MessageWithOptionalChainRow[], string>(
    {
      key: "chat-messages",
      query: (chatId) => {
        const cdb = clientDb();
        const { baseQuery } = createMessagesBaseQuery(cdb);

        return baseQuery.where(eq(messageTable.chatId, chatId)).toSQL();
      },
      transform: (rows) =>
        (
          rows as (typeof messageTable.$inferSelect & {
            segments: SegmentJson[];
            tokenStream: TokenStreamJson[] | null;
          })[]
        ).map((row) => ({
          ...(transformKeyToCamelCaseRecursive(row) as typeof messageTable.$inferSelect),
          segments: row.segments ?? null,
          tokenStream: row.tokenStream ?? null,
        })) satisfies MessageWithOptionalChainRow[],
    },
    serverData,
    chatId,
  );
