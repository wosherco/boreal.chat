import type { ServerData, ServerDataGetter } from "$lib/common/sharedTypes";
import isPromise from "is-promise";
import { getDbInstance } from "./index.svelte";
import type { CommonDBClient } from "./LocalDatabase.svelte";
import { browser } from "$app/environment";

export class HydratableQuery<T, TArgs = void> {
  private query: (db: CommonDBClient, args: TArgs) => { sql: string; params: unknown[] } | null;
  private transform: (rows: unknown[]) => T;
  private args?: () => TArgs;

  // SSR stuff
  private ssrData: ServerDataGetter<T>;
  private loadingSSRState = $state(true);
  private resolvedSSRData = $state<T | null>(null);

  // Client stuff
  private clientData = $state<T | null>(null);
  private loadingClientState = $state(true);

  constructor(
    query: (db: CommonDBClient, args: TArgs) => { sql: string; params: unknown[] } | null,
    transform: (rows: unknown[]) => T,
    ssrData: () => ServerData<T>,
    args?: () => TArgs,
  ) {
    this.query = query;
    this.transform = transform;
    this.ssrData = ssrData;
    this.args = args;

    this.initialize();
  }

  protected initialize() {
    $effect(() => {
      this.loadingSSRState = true;
      const resolvedSSRData = this.ssrData();

      if (isPromise(resolvedSSRData)) {
        resolvedSSRData.then((data) => {
          this.resolvedSSRData = data;
          this.loadingSSRState = false;
        });
      } else {
        this.resolvedSSRData = resolvedSSRData;
        this.loadingSSRState = false;
      }
    });

    if (!browser) {
      return;
    }

    $effect(() => {
      this.loadingClientState = true;

      const abortController = new AbortController();

      const dbInstance = getDbInstance();

      if (!dbInstance) {
        return;
      }

      const resolvedArgs = this.args?.();

      dbInstance.waitForReady.then(() => {
        const resolvedQuery = this.query(dbInstance.drizzle, resolvedArgs ?? (null as TArgs));

        if (!resolvedQuery) {
          this.loadingClientState = false;
          this.clientData = null;
          return;
        }

        dbInstance.pglite.live.query({
          query: resolvedQuery.sql,
          params: resolvedQuery.params,
          signal: abortController.signal,
          callback: (results) => {
            const transformed = this.transform(results.rows);

            if (!transformed) {
              return;
            }

            this.loadingClientState = false;
            this.clientData = transformed;
          },
        });
      });

      return () => {
        abortController.abort();
      };
    });
  }

  get loading() {
    return this.loadingSSRState && this.loadingClientState;
  }

  get data() {
    if (!this.loadingClientState) {
      return this.clientData;
    }
    return this.resolvedSSRData;
  }

  get ssr() {
    return this.loadingClientState;
  }
}
