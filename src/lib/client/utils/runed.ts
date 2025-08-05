import { browser } from "$app/environment";

export type ConfigurableWindow = {
  /** Provide a custom `window` object to use in place of the global `window` object. */
  window?: typeof globalThis & Window;
};

export const defaultWindow = browser && typeof window !== "undefined" ? window : undefined;
