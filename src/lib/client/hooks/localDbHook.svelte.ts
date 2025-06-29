import { browser } from "$app/environment";
import { writable, type Readable } from "svelte/store";
import { initializeClientDbPromise, pglite } from "../db/index.svelte";
import isPromise from "is-promise";
import type { HydratableDataResult, ServerData } from "$lib/common/sharedTypes";

interface HydratableData<T, TArgs = void> {
  key: string;
  query: (args: TArgs) => { sql: string; params: unknown[] };
  transform: (rows: unknown[], args: TArgs) => T | null;
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
  args: TArgs,
): HydratableReadable<T> {
  const cacheKey = createCacheKey(config.key, args);

  if (!browser) {
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
    const abortController = new AbortController();

    initializeClientDbPromise.then(() => {
      const { sql: query, params } = config.query(args);

      pglite().live.query({
        query,
        params,
        signal: abortController.signal,
        callback(results) {
          hasHydratedInClient = true;
          const transformed = config.transform(results.rows, args);

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

    return () => abortController.abort();
  };

  setSSRData(ssrData);
  unsubscribeCallback = createLiveQuery();

  const refetchQuery = () => {
    if (!hasSubscribers) {
      return;
    }

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
