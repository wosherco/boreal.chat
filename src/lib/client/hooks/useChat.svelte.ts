import type { ChatWithSettings, ServerDataGetter } from "$lib/common/sharedTypes";
import { eq } from "drizzle-orm";
import { chatTable } from "../db/schema";
import { transformKeyToCamelCaseRecursive } from "./utils";
import { HydratableQuery } from "../db/HydratableQuery.svelte";

export const createChat = (serverData: ServerDataGetter<ChatWithSettings>, chatId: () => string) =>
  new HydratableQuery(
    (db, chatId) =>
      db
        .select({
          id: chatTable.id,
          title: chatTable.title,
          pinned: chatTable.pinned,
          createdAt: chatTable.createdAt,
          updatedAt: chatTable.updatedAt,
          selectedModel: chatTable.selectedModel,
          webSearchEnabled: chatTable.webSearchEnabled,
          reasoningLevel: chatTable.reasoningLevel,
          byokId: chatTable.byokId,
        })
        .from(chatTable)
        .where(eq(chatTable.id, chatId))
        .toSQL(),
    ([chatData]) =>
      chatData
        ? (transformKeyToCamelCaseRecursive(
            chatData as Record<string, unknown>,
          ) as unknown as ChatWithSettings)
        : null,
    serverData,
    chatId,
  );
