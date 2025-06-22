import { browser } from "$app/environment";

export function pickSSRorSPAPromise<T>(
  ssrPromise: Promise<T> | null,
  spaData: () => Promise<T> | null,
) {
  return ssrPromise || !browser ? ssrPromise : spaData();
}
