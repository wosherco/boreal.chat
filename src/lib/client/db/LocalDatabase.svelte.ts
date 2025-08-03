import { browser } from "$app/environment";
import { electricSync, type SyncShapesToTablesResult } from "@electric-sql/pglite-sync";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { live } from "@electric-sql/pglite/live";
import { PGliteWorker } from "@electric-sql/pglite/worker";
import AsyncLock from "async-lock";
import { migrateClient } from "./migrator";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/pglite";
import { env } from "$env/dynamic/public";
import { getTableColumnNames } from "./utils";
import { orpc } from "../orpc";
import type { ServerCurrentUserInfo } from "$lib/common/sharedTypes";
import { resetDatabaseInstance } from "./index.svelte";

async function createPGLiteInstance() {
  const PGWorker = await import("./worker.ts?worker");
  return PGliteWorker.create(
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
}

export type PGliteType = NonNullable<Awaited<ReturnType<typeof createPGLiteInstance>>>;

const createDrizzleClient = (db: PGliteType) =>
  // @ts-expect-error we're using the DB from a worker, which is not typed, but it's practically the same
  drizzle({ client: db, schema, casing: "snake_case" });

export type CommonDBClient = ReturnType<typeof createDrizzleClient>;

export class LocalDatabase {
  private dbClientReady = $state(false);
  private pgliteState = $state<PGliteType | null>(null);
  private drizzleStateCache = $state<ReturnType<typeof createDrizzleClient> | null>(null);
  private currentStreams = $state<SyncShapesToTablesResult | null>(null);
  readonly dbLock = new AsyncLock();
  private abortController = new AbortController();
  private offlineState = $state(false);
  private destroyed = $state(false);

  private connectionCheckInterval = $state<NodeJS.Timeout | null>(null);

  constructor() {
    this.initialize().then(() => {
      this.forceConnectionCheck();
    });
  }

  private async initialize() {
    if (!browser) return;

    await this.dbLock.acquire("initialize", async () => {
      if (this.dbClientReady) return;

      const pglite = await createPGLiteInstance();

      await pglite.waitReady;

      await this.runMigrations(pglite);

      this.pgliteState = pglite;
      this.dbClientReady = true;
    });
  }

  private async runMigrations(pglite: PGliteType) {
    try {
      await migrateClient(createDrizzleClient(pglite), pglite);
    } catch (error) {
      console.error(`❌ Client migrations failed`, error);
      await resetDatabaseInstance();
      throw error;
    }
  }

  async forceConnectionCheck() {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    const checkConnection = async () => {
      if (!this.ready) {
        console.log("PGlite is not initialized yet");
        return;
      }

      if (this.syncing) {
        // console.log("Syncing working");
        return;
      }

      let user: ServerCurrentUserInfo;

      try {
        user = await orpc.v1.auth.getUser();
      } catch (error) {
        console.log("Error connecting to the server. It might be offline.", error);
        this.offlineState = true;
        return;
      }

      if (!user.canSync) {
        console.log("User can't sync");
        // We can't sync because we don't have a user or any data... We're not necessarily offline, but we're not going to sync.
        return;
      }

      this.offlineState = false;
      this.startShapesSync();
    };

    this.connectionCheckInterval = setInterval(checkConnection, 5000);
  }

  private async startShapesSync() {
    const onSyncError = (error: Error) => {
      console.error("Sync error", error);
      this.stopShapesSync();
      this.forceConnectionCheck();
    };

    const localCurrentStreams = await this.pglite.electric.syncShapesToTables({
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
            signal: this.abortController.signal,
            onError: onSyncError,
          },
          table: "user",
          primaryKey: ["id"],
        },
        byok: {
          shape: {
            url: `${env.PUBLIC_URL}/api/v1/shape`,
            params: {
              table: "byok",
              columns: getTableColumnNames(schema.byokTable),
            },
            headers: {
              "cache-control": "no-cache",
            },
            signal: this.abortController.signal,
            onError: onSyncError,
          },
          table: "byok",
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
            signal: this.abortController.signal,
            onError: onSyncError,
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
            signal: this.abortController.signal,
            onError: onSyncError,
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
            signal: this.abortController.signal,
            onError: onSyncError,
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
            signal: this.abortController.signal,
            onError: onSyncError,
          },
          table: "message_segments",
          primaryKey: ["id"],
        },
        draft: {
          shape: {
            url: `${env.PUBLIC_URL}/api/v1/shape`,
            params: {
              table: "drafts",
              columns: getTableColumnNames(schema.draftsTable),
            },
            headers: {
              "cache-control": "no-cache",
            },
            signal: this.abortController.signal,
            onError: onSyncError,
          },
          table: "drafts",
          primaryKey: ["id"],
        },
      },
      key: "boreal-chat-sync-v1",
      onInitialSync: async () => {
        console.log("Sync done");
      },
    });

    this.currentStreams = localCurrentStreams;

    return new Promise((resolve) => {
      // This is nasty af, and an awful hack. Hopefully we can find a better way to do this with the elastic & pglite team.
      const intervalCheck = setInterval(async () => {
        if (localCurrentStreams.isUpToDate) {
          clearInterval(intervalCheck);
          await this.pglite.syncToFs();

          let currentDBUser: typeof schema.userTable.$inferSelect | undefined = undefined;
          for (let i = 0; i < 10; i++) {
            const [queriedDBUser] = await this.drizzle.select().from(schema.userTable).limit(1);
            if (queriedDBUser) {
              currentDBUser = queriedDBUser;
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 50));
          }

          if (!currentDBUser) {
            console.log("Something went wrong, clearing local db");
            await resetDatabaseInstance();
          } else {
            resolve(true);
            console.log("Shapes sync done");
          }
        } else {
          console.log("Syncing still not done");
        }
      }, 50);
    });
  }

  async stopShapesSync() {
    if (this.currentStreams) {
      this.currentStreams.unsubscribe();
      this.currentStreams = null;
    }
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  async destroy() {
    if (this.destroyed) return;

    this.destroyed = true;

    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    await this.stopShapesSync();

    if (this.ready) {
      await this.pglite.close();
    }

    indexedDB.deleteDatabase("/pglite/borealchat-syncdata");

    this.dbClientReady = false;
    this.pgliteState = null;
  }

  get pglite() {
    if (!browser) {
      throw new Error("PGlite is not available on the server");
    }

    if (!this.pgliteState) {
      throw new Error("PGlite is not initialized");
    }

    return this.pgliteState;
  }

  get drizzle() {
    if (this.drizzleStateCache) {
      return this.drizzleStateCache;
    }

    const drizzleState = createDrizzleClient(this.pglite);
    this.drizzleStateCache = drizzleState;
    return drizzleState;
  }

  get ready() {
    return browser && this.dbClientReady && !!this.pgliteState;
  }

  get syncStreams() {
    return this.currentStreams;
  }

  get syncing() {
    return !!this.currentStreams;
  }

  get offline() {
    return this.offlineState;
  }

  get waitForReady() {
    if (this.ready) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const cleanup = $effect.root(() => {
        if (this.ready) {
          cleanup();
          resolve(true);
        }
      });
    });
  }
}
