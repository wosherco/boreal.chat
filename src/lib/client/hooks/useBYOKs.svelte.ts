import type { ServerData, BYOKInfo } from "$lib/common/sharedTypes";
import { clientDb } from "../db/index.svelte";
import { byokTable } from "../db/schema";
import { createHydratableData } from "./localDbHook";
import { transformKeyToCamelCaseRecursive } from "./utils";

export const useBYOKs = (serverData: ServerData<BYOKInfo[]>) =>
  createHydratableData<BYOKInfo[], void>(
    {
      key: "byoks",
      query: () =>
        clientDb()
          .select({
            id: byokTable.id,
            apiKey: byokTable.apiKey,
            platform: byokTable.platform,
            createdAt: byokTable.createdAt,
            updatedAt: byokTable.updatedAt,
          })
          .from(byokTable)
          .toSQL(),
      transform: (byokData) =>
        byokData.map(
          (byok) => transformKeyToCamelCaseRecursive(byok as Record<string, unknown>) as BYOKInfo,
        ),
    },
    serverData ?? null,
    undefined,
  );
