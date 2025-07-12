import type { Draft, ServerData } from "$lib/common/sharedTypes";
import { eq } from "drizzle-orm";
import { clientDb } from "../db/index.svelte";
import { draftsTable } from "../db/schema";
import { createHydratableData } from "./localDbHook";
import { transformKeyToCamelCaseRecursive } from "./utils";

export const useDraft = (draftId: string | null, serverData: ServerData<Draft>) =>
  draftId
    ? createHydratableData<Draft, string>(
        {
          key: "draft",
          query: (draftId) =>
            clientDb()
              .select({
                id: draftsTable.id,
                content: draftsTable.content,
                selectedModel: draftsTable.selectedModel,
                reasoningLevel: draftsTable.reasoningLevel,
                webSearchEnabled: draftsTable.webSearchEnabled,
                createdAt: draftsTable.createdAt,
                updatedAt: draftsTable.updatedAt,
              })
              .from(draftsTable)
              .where(eq(draftsTable.id, draftId))
              .toSQL(),
          transform: ([draftData]) =>
            draftData
              ? (transformKeyToCamelCaseRecursive(
                  draftData as Record<string, unknown>,
                ) as unknown as Draft)
              : null,
        },
        serverData,
        draftId,
      )
    : null;
