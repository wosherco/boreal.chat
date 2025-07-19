import type { Chat, ServerData } from "$lib/common/sharedTypes";
import { desc, eq, isNull, and } from "drizzle-orm";
import { clientDb } from "../db/index.svelte";
import { chatTable } from "../db/schema";
import { createHydratableData } from "./localDbHook";
import { transformKeyToCamelCaseRecursive } from "./utils";

export const useChats = (serverData: ServerData<Chat[]>) =>
  createHydratableData<Chat[]>(
    {
      key: "chats",
      query: () =>
        clientDb()
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
          .where(and(eq(chatTable.archived, false), isNull(chatTable.deletedAt)))
          .orderBy(desc(chatTable.pinned), desc(chatTable.updatedAt))
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
    undefined,
  );
