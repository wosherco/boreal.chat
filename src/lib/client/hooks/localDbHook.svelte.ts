import { browser } from "$app/environment";
import { readable, type Readable } from "svelte/store";
import { initializeClientDbPromise, pglite } from "../db/index.svelte";
import isPromise from "is-promise";
import type { HydratableDataResult, ServerData } from "$lib/common/sharedTypes";

interface HydratableData<T, TArgs = void> {
  key: string;
  query: (args: TArgs) => { sql: string; params: unknown[] };
  transform: (rows: unknown[], args: TArgs) => T | null;
}

const cache = new Map<string, Readable<unknown>>();

function createCacheKey<TArgs = void>(key: string, args: TArgs) {
  return `${key}-${JSON.stringify(args)}`;
}

export function createHydratableData<T, TArgs = void>(
  config: HydratableData<T, TArgs>,
  ssrData: ServerData<T>,
  args: TArgs,
): Readable<HydratableDataResult<T>> {
  const cacheKey = createCacheKey(config.key, args);

  if (!browser) {
    if (!ssrData) {
      return readable({
        loading: true,
        ssr: true,
        data: null,
      });
    }

    if (isPromise(ssrData)) {
      return readable<HydratableDataResult<T>>(
        {
          loading: true,
          ssr: true,
          data: null,
        },
        (set) => {
          ssrData.then((data) => {
            set({ loading: false, ssr: true, data });
          });
        },
      );
    }

    return readable({
      loading: false,
      ssr: true,
      data: ssrData,
    });
  }

  if (cache.has(cacheKey)) {
    // @ts-expect-error TODO: Fix this type. Maybe some validation?
    return cache.get(cacheKey)!;
  }

  let firstCallback = false;

  const hydratedStore = readable<HydratableDataResult<T>>(
    {
      loading: ssrData === null || isPromise(ssrData),
      ssr: true,
      data: ssrData as T | null,
    },
    (set) => {
      if (isPromise(ssrData)) {
        ssrData.then((data) => {
          if (firstCallback) {
            return;
          }
          set({ loading: false, ssr: true, data });
        });
      }

      const abortController = new AbortController();

      initializeClientDbPromise.then(() => {
        const { sql: query, params } = config.query(args);

        pglite().live.query({
          query,
          params,
          signal: abortController.signal,
          callback(results) {
            firstCallback = true;
            const transformed = config.transform(results.rows, args);

            if (!transformed) {
              return;
            }

            set({
              loading: false,
              ssr: false,
              data: transformed,
            });
          },
        });
      });

      return () => abortController.abort();
    },
  );

  cache.set(cacheKey, hydratedStore);

  return hydratedStore;
}
