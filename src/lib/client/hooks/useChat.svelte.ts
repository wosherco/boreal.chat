import type { ChatWithSettings, ServerData } from "$lib/common/sharedTypes";
import { eq } from "drizzle-orm";
import { chatTable } from "../db/schema";
import { createHydratableData } from "./localDbHook";
import { transformKeyToCamelCaseRecursive } from "./utils";

export const useChat = (serverData: ServerData<ChatWithSettings>, chatId: () => string) =>
  createHydratableData<ChatWithSettings, string>(
    {
      key: "chat",
      query: (db, chatId) =>
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
      transform: ([chatData]) =>
        chatData
          ? (transformKeyToCamelCaseRecursive(
              chatData as Record<string, unknown>,
            ) as unknown as ChatWithSettings)
          : null,
    },
    serverData,
    chatId,
  );
