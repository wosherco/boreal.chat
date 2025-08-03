import { browser } from "$app/environment";
import { writable, type Readable } from "svelte/store";
import isPromise from "is-promise";
import type { HydratableDataResult, ServerData } from "$lib/common/sharedTypes";
import type { CommonDBClient } from "../db/LocalDatabase.svelte";
import { getDbInstance } from "../db/index.svelte";

interface HydratableData<T, TArgs = void> {
  key: string;
  query: (db: CommonDBClient, args: NonNullable<TArgs>) => { sql: string; params: unknown[] };
  transform: (rows: unknown[], args: NonNullable<TArgs>) => T | null;
}

const cache = new Map<string, HydratableReadable<unknown>>();

function createCacheKey<TArgs = void>(key: string, args: TArgs) {
  return `${key}-${JSON.stringify(args)}`;
}

export interface HydratableReadable<T> extends Readable<HydratableDataResult<T>> {
  refreshQuery: () => void;
  _setSSRData: (data: ServerData<T>) => void;
}

export function createHydratableData<T, TArgs = void>(
  config: HydratableData<T, TArgs>,
  ssrData: ServerData<T>,
  args: () => TArgs,
): HydratableReadable<T> {
  const cacheKey = createCacheKey(config.key, args());

  if (!browser) {
    // In browser we don't need to care about reactivity
    const ssrStore = createHydratableDataSSR(ssrData);
    cache.set(cacheKey, ssrStore as HydratableReadable<unknown>);
    return ssrStore;
  }

  const existingStore = cache.get(cacheKey);
  if (existingStore) {
    existingStore._setSSRData(ssrData);

    return existingStore as HydratableReadable<T>;
  }

  let hasHydratedInClient = false;
  let hasSubscribers = false;
  let unsubscribeCallback: undefined | (() => void);

  const dbStore = writable<HydratableDataResult<T>>(
    {
      loading: true,
      ssr: true,
      data: null,
    },
    () => {
      hasSubscribers = true;
      // When someone starts listening, we initialize a live query
      refetchQuery();

      return () => {
        console.log(config.key, "UNSUBSCRIBING");
        unsubscribeCallback?.();
        unsubscribeCallback = undefined;
        hasSubscribers = false;
      };
    },
  );

  const setSSRData = (data: ServerData<T>) => {
    if (hasHydratedInClient || !data) {
      return;
    }

    if (isPromise(data)) {
      data.then((data) => {
        if (hasHydratedInClient) {
          return;
        }
        dbStore.set({ loading: false, ssr: true, data });
      });
    } else {
      dbStore.set({
        loading: false,
        ssr: true,
        data: data,
      });
    }
  };

  const createLiveQuery = () => {
    console.log(config.key, "CREATING LIVE QUERY");
    const abortController = new AbortController();

    const dbInstance = getDbInstance();

    if (!dbInstance) {
      throw new Error("Database not initialized");
    }

    const resolvedArgs = args();

    if (!resolvedArgs) {
      return;
    }

    dbInstance.waitForReady.then(() => {
      const { sql: query, params } = config.query(dbInstance.drizzle, resolvedArgs);

      dbInstance.pglite.live.query({
        query,
        params,
        signal: abortController.signal,
        callback(results) {
          hasHydratedInClient = true;
          const transformed = config.transform(results.rows, resolvedArgs);

          if (!transformed) {
            return;
          }

          dbStore.set({
            loading: false,
            ssr: false,
            data: transformed,
          });
        },
      });
    });

    return () => {
      console.log(config.key, "ABORTING LIVE QUERY");
      abortController.abort();
    };
  };

  setSSRData(ssrData);
  unsubscribeCallback = createLiveQuery();

  const refetchQuery = () => {
    if (!hasSubscribers) {
      return;
    }

    console.log(config.key, "REFETCHING QUERY");
    // When we're refetching, we need to unsubscribe from the previous live query
    // and create a new one
    unsubscribeCallback?.();
    unsubscribeCallback = createLiveQuery();
  };

  const hydratedStore: HydratableReadable<T> = {
    refreshQuery: refetchQuery,
    _setSSRData: setSSRData,
    subscribe: dbStore.subscribe,
  };

  cache.set(cacheKey, hydratedStore as HydratableReadable<unknown>);

  return hydratedStore;
}

function createHydratableDataSSR<T>(ssrData: ServerData<T>): HydratableReadable<T> {
  const refetch = () => {
    // On the server we're not refetching
  };

  const store = writable<HydratableDataResult<T>>({
    loading: true,
    ssr: true,
    data: null,
  });

  const setSSRData = (data: ServerData<T>) => {
    if (!data) {
      return;
    } else if (isPromise(data)) {
      data.then((data) => {
        store.set({ loading: false, ssr: true, data });
      });
    } else {
      store.set({ loading: false, ssr: true, data });
    }
  };

  setSSRData(ssrData);

  return {
    refreshQuery: refetch,
    _setSSRData: setSSRData,
    subscribe: store.subscribe,
  };
}

export function getAllCacheValues() {
  return Array.from(cache.values());
}
