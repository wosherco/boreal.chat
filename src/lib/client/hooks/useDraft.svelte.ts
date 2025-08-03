import type { Draft, ServerDataGetter } from "$lib/common/sharedTypes";
import { eq } from "drizzle-orm";
import { draftsTable } from "../db/schema";
import { transformKeyToCamelCaseRecursive } from "./utils";
import { HydratableQuery } from "../db/HydratableQuery.svelte";

export const createDraft = (serverData: ServerDataGetter<Draft>, draftId: () => string | null) =>
  new HydratableQuery(
    (db, draftId) => {
      if (!draftId) {
        return null;
      }

      return db
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
        .toSQL();
    },
    ([draftData]) =>
      draftData
        ? (transformKeyToCamelCaseRecursive(
            draftData as Record<string, unknown>,
          ) as unknown as Draft)
        : null,
    serverData,
    draftId,
  );
