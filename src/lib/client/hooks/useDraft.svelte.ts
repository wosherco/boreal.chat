import type { Draft, ServerData } from "$lib/common/sharedTypes";
import { eq } from "drizzle-orm";
import { draftsTable } from "../db/schema";
import { createHydratableData } from "./localDbHook";
import { transformKeyToCamelCaseRecursive } from "./utils";

export const useDraft = (serverData: ServerData<Draft>, draftId: () => string | null) =>
  createHydratableData<Draft, string | null>(
    {
      key: "draft",
      query: (db, draftId) =>
        db
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
  );
