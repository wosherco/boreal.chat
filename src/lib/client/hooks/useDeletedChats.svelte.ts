import type { Chat, ServerDataGetter } from "$lib/common/sharedTypes";
import { desc, isNotNull } from "drizzle-orm";
import { chatTable } from "../db/schema";
import { transformKeyToCamelCaseRecursive } from "./utils";
import { HydratableQuery } from "../db/HydratableQuery.svelte";

export const createDeletedChats = (serverData: ServerDataGetter<Chat[]>) =>
  new HydratableQuery(
    (db) =>
      db
        .select({
          id: chatTable.id,
          title: chatTable.title,
          pinned: chatTable.pinned,
          archived: chatTable.archived,
          deletedAt: chatTable.deletedAt,
          createdAt: chatTable.createdAt,
          updatedAt: chatTable.updatedAt,
        })
        .from(chatTable)
        .where(isNotNull(chatTable.deletedAt))
        .orderBy(desc(chatTable.deletedAt))
        .toSQL(),
    (chatData) =>
      chatData.map(
        (chat) =>
          transformKeyToCamelCaseRecursive(
            chat as unknown as Record<string, unknown>,
          ) as unknown as Chat,
      ),
    serverData,
  );
