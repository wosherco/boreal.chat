import { PGliteWorker } from "@electric-sql/pglite/worker";
import { drizzle } from "drizzle-orm/pglite";
import { live } from "@electric-sql/pglite/live";
import { electricSync, type SyncShapesToTablesResult } from "@electric-sql/pglite-sync";
import * as schema from "./schema";
import AsyncLock from "async-lock";
import { migrateClient } from "./migrator";
import { env } from "$env/dynamic/public";
import { browser } from "$app/environment";
import { getTableColumnNames } from "./utils";
import { orpc } from "../orpc";
import { ORPCError } from "@orpc/client";
import { invalidateAll } from "$app/navigation";
import { getTableName, sql } from "drizzle-orm";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

const initializeDbLock = new AsyncLock();

export type PGliteType = NonNullable<Awaited<ReturnType<typeof initializeClientDb>>>;

let dbClientReady = $state(false);
let pgliteState = $state<PGliteType | null>(null);
const createDrizzleClient = (db: PGliteType) =>
  // @ts-expect-error we're using the DB from a worker, which is not typed, but it's practically the same
  drizzle({ client: db, schema, casing: "snake_case" });
const drizzleState = $derived(!pgliteState ? null : createDrizzleClient(pgliteState));
export type ClientDBType = Exclude<typeof drizzleState, null>;

export const isDbReady = () => dbClientReady;
export const pglite = () => {
  if (!browser) {
    throw new Error("PGlite is not available on the server");
  }

  if (!pgliteState) {
    throw new Error("PGlite is not initialized");
  }

  return pgliteState;
};
export const clientDb = () => {
  if (!drizzleState) {
    throw new Error("Drizzle is not initialized");
  }

  return drizzleState;
};

async function initializeClientDb() {
  if (!browser) return;

  return await initializeDbLock.acquire("initializeClientDb", async () => {
    if (dbClientReady) return;

    const startTime = performance.now();
    console.log("🚀 Starting client database initialization...");

    // Benchmark: Worker creation
    const workerStartTime = performance.now();
    const PGWorker = await import("./worker.ts?worker");
    const workerImportTime = performance.now() - workerStartTime;
    console.log(`📦 Worker import took: ${workerImportTime.toFixed(2)}ms`);

    // Benchmark: PGlite creation
    const pgliteCreateStartTime = performance.now();
    const pglite = await PGliteWorker.create(
      new PGWorker.default({
        name: "pglite-worker",
      }),
      {
        relaxedDurability: true,
        extensions: {
          electric: electricSync(),
          live,
          pg_trgm,
        },
      },
    );
    const pgliteCreateTime = performance.now() - pgliteCreateStartTime;
    console.log(`⚡ PGliteWorker creation took: ${pgliteCreateTime.toFixed(2)}ms`);

    // Benchmark: Wait ready
    const waitReadyStartTime = performance.now();
    await pglite.waitReady;
    const waitReadyTime = performance.now() - waitReadyStartTime;
    console.log(`⏳ PGlite waitReady took: ${waitReadyTime.toFixed(2)}ms`);

    // Benchmark: Client-side migrations
    const migrationsStartTime = performance.now();
    try {
      await migrateClient(createDrizzleClient(pglite), pglite);
      const migrationsTime = performance.now() - migrationsStartTime;
      console.log(`🔄 Client migrations took: ${migrationsTime.toFixed(2)}ms`);
    } catch (error) {
      const migrationsTime = performance.now() - migrationsStartTime;
      console.error(`❌ Client migrations failed after ${migrationsTime.toFixed(2)}ms:`, error);
      throw error;
    }

    // Benchmark: State assignment
    const stateStartTime = performance.now();
    pgliteState = pglite;
    dbClientReady = true;
    const stateTime = performance.now() - stateStartTime;
    console.log(`📝 State assignment took: ${stateTime.toFixed(2)}ms`);

    const totalTime = performance.now() - startTime;
    console.log(`✅ Total client database initialization took: ${totalTime.toFixed(2)}ms`);

    // Summary breakdown
    console.log("\n📊 Initialization Breakdown:");
    console.log(
      `  Worker Import:     ${workerImportTime.toFixed(2)}ms (${((workerImportTime / totalTime) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  PGlite Creation:   ${pgliteCreateTime.toFixed(2)}ms (${((pgliteCreateTime / totalTime) * 100).toFixed(1)}%)`,
    );
    console.log(
      `  Wait Ready:        ${waitReadyTime.toFixed(2)}ms (${((waitReadyTime / totalTime) * 100).toFixed(1)}%)`,
    );
    console.log(`  Migrations:        ${(performance.now() - migrationsStartTime).toFixed(2)}ms`);
    console.log(
      `  State Assignment:  ${stateTime.toFixed(2)}ms (${((stateTime / totalTime) * 100).toFixed(1)}%)`,
    );

    await startShapesSync();

    return pglite;
  });
}

export const initializeClientDbPromise = initializeClientDb();

let currentStreams: SyncShapesToTablesResult | null = null;

export const syncStreams = () => currentStreams;

async function startShapesSync() {
  if (currentStreams) {
    console.log("Already syncing shapes");
    return;
  }

  console.log("Starting shapes sync");

  try {
    await orpc.v1.auth.getUser();
  } catch (err) {
    if (err instanceof ORPCError && err.status === 401) {
      console.log("We're not logged in, we're not syncing shapes");
      await clearLocalDb();
      return;
    }
  }

  currentStreams = await pglite().electric.syncShapesToTables({
    shapes: {
      user: {
        shape: {
          url: `${env.PUBLIC_URL}/api/v1/shape`,
          params: {
            table: "user",
            columns: getTableColumnNames(schema.userTable),
          },
          headers: {
            "cache-control": "no-cache",
          },
        },
        table: "user",
        primaryKey: ["id"],
      },
      chat: {
        shape: {
          url: `${env.PUBLIC_URL}/api/v1/shape`,
          params: {
            table: "chats",
            columns: getTableColumnNames(schema.chatTable),
          },
          headers: {
            "cache-control": "no-cache",
          },
        },
        table: "chats",
        primaryKey: ["id"],
      },
      thread: {
        shape: {
          url: `${env.PUBLIC_URL}/api/v1/shape`,
          params: {
            table: "threads",
            columns: getTableColumnNames(schema.threadTable),
          },
          headers: {
            "cache-control": "no-cache",
          },
        },
        table: "threads",
        primaryKey: ["id"],
      },
      message: {
        shape: {
          url: `${env.PUBLIC_URL}/api/v1/shape`,
          params: {
            table: "messages",
            columns: getTableColumnNames(schema.messageTable),
          },
          headers: {
            "cache-control": "no-cache",
          },
        },
        table: "messages",
        primaryKey: ["id"],
      },
      message_segment: {
        shape: {
          url: `${env.PUBLIC_URL}/api/v1/shape`,
          params: {
            table: "message_segments",
            columns: getTableColumnNames(schema.messageSegmentsTable),
          },
          headers: {
            "cache-control": "no-cache",
          },
        },
        table: "message_segments",
        primaryKey: ["id"],
      },
      message_token: {
        shape: {
          url: `${env.PUBLIC_URL}/api/v1/shape`,
          params: {
            table: "message_tokens",
            columns: getTableColumnNames(schema.messageTokensTable),
          },
          headers: {
            "cache-control": "no-cache",
          },
        },
        table: "message_tokens",
        primaryKey: ["id"],
      },
    },
    key: "boreal-chat-sync-v1",
    onInitialSync: () => {
      console.log("Sync done. Invalidating everything...");
      invalidateAll();
    },
  });

  console.log("Shapes sync done");
}

export async function clearLocalDb() {
  if (currentStreams) {
    currentStreams.unsubscribe();
    currentStreams = null;
  }

  console.log("Clearing local db...");

  await Promise.all(
    Object.values(schema).map(async (table) => {
      await clientDb().execute(
        sql`TRUNCATE TABLE ${sql.identifier(getTableName(table))}
        RESTART IDENTITY   -- resets sequences to their start values
        CASCADE;           -- also truncates any tables that have FKs pointing here
       `,
      );
    }),
  );

  await pglite().syncToFs();
}
