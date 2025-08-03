import type { Chat, ServerData } from "$lib/common/sharedTypes";
import { desc, isNotNull } from "drizzle-orm";
import { chatTable } from "../db/schema";
import { createHydratableData } from "./localDbHook";
import { transformKeyToCamelCaseRecursive } from "./utils";

export const useDeletedChats = (serverData: ServerData<Chat[]>) =>
  createHydratableData<Chat[]>(
    {
      key: "deletedChats",
      query: (db) =>
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
      transform: (chatData) =>
        chatData.map(
          (chat) =>
            transformKeyToCamelCaseRecursive(
              chat as unknown as Record<string, unknown>,
            ) as unknown as Chat,
        ),
    },
    serverData,
    () => undefined,
  );
