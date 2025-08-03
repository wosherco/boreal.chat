import type { AnyPgTable, PgTableWithColumns, TableConfig } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import { getDbInstance } from "../db/index.svelte";

/**
 * Waits for an insert to be committed to the database.
 * @param table - The table to wait for.
 * @param id - The id of the row to wait for.
 * @param timeout - The timeout in milliseconds. Defaults to 10 seconds.
 * @returns A promise that resolves when the insert is committed.
 * @throws An error if the timeout is reached.
 */
export function waitForInsert<T extends TableConfig>(
  table: PgTableWithColumns<T>,
  id: string,
  /**
   * @default 10000
   */
  timeout?: number,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const abortController = new AbortController();

    const timeoutId = setTimeout(() => {
      abortController.abort();
      reject(new Error("Timeout waiting for insert"));
    }, timeout);

    const dbInstance = getDbInstance();

    if (!dbInstance) {
      throw new Error("Database not initialized");
    }

    dbInstance.waitForReady.then(() => {
      const { sql: query, params } = dbInstance.drizzle
        .select({
          id: table.id,
        })
        .from(table as AnyPgTable)
        .where(eq(table.id, id))
        .toSQL();

      dbInstance.pglite.live.query({
        query,
        params,
        signal: abortController.signal,
        callback(results) {
          if (results.rows.length > 0) {
            abortController.abort();
            clearTimeout(timeoutId);
            resolve();
          }
        },
      });
    });
  });
}
