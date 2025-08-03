import type { Draft } from "$lib/common/sharedTypes";
import { desc } from "drizzle-orm";
import { draftsTable } from "../db/schema";
import { createHydratableData } from "./localDbHook";
import { transformKeyToCamelCaseRecursive } from "./utils";

export const useDrafts = () =>
  createHydratableData<Draft[]>(
    {
      key: "drafts",
      query: (db) =>
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
          .orderBy(desc(draftsTable.updatedAt))
          .toSQL(),
      transform: (draftData) =>
        draftData.map(
          (draft) =>
            transformKeyToCamelCaseRecursive(
              draft as unknown as Record<string, unknown>,
            ) as unknown as Draft,
        ),
    },
    null, // No server hydration needed
    () => undefined,
  );
