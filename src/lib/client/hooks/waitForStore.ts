import type { Readable } from "svelte/store";

/**
 * Waits for a store to be updated and returns the value.
 * @param store - The store to wait for.
 * @param timeout - The timeout in milliseconds. Defaults to 10 seconds.
 * @returns The value of the store.
 */
export function waitForStore<T>(
  store: Readable<T>,
  predicate: (value: T) => boolean,
  /**
   * @default 10000
   */
  timeout?: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("Timeout waiting for store"));
    }, timeout);

    const unsubscribe = store.subscribe((value) => {
      if (predicate(value)) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(value);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  });
}
