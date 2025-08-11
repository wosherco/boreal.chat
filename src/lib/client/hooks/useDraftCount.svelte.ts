import type { ServerDataGetter } from "$lib/common/sharedTypes";
import { count } from "drizzle-orm";
import { draftsTable } from "../db/schema";
import { HydratableQuery } from "../db/HydratableQuery.svelte";

export const createDraftCount = (serverData: ServerDataGetter<number>) =>
  new HydratableQuery(
    (db) =>
      db
        .select({ count: count(draftsTable.id) })
        .from(draftsTable)
        .toSQL(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (rows: any[]) => (rows[0]?.count as number) ?? 0,
    serverData,
  );
