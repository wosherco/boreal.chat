import type { BYOKInfo, ServerDataGetter } from "$lib/common/sharedTypes";
import { byokTable } from "../db/schema";
import { transformKeyToCamelCaseRecursive } from "./utils";
import { HydratableQuery } from "../db/HydratableQuery.svelte";

export const createBYOKs = (serverData: ServerDataGetter<BYOKInfo[]>) =>
  new HydratableQuery(
    (db) =>
      db
        .select({
          id: byokTable.id,
          apiKey: byokTable.apiKey,
          platform: byokTable.platform,
          createdAt: byokTable.createdAt,
          updatedAt: byokTable.updatedAt,
        })
        .from(byokTable)
        .toSQL(),
    (byokData) =>
      byokData.map(
        (byok) => transformKeyToCamelCaseRecursive(byok as Record<string, unknown>) as BYOKInfo,
      ),
    serverData,
  );
