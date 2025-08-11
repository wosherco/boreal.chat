import { browser } from "$app/environment";

export function pickSSRorSPAPromise<T>(
  ssrPromise: Promise<T> | null,
  spaData: () => Promise<T> | null,
) {
  const platform = (import.meta.env.VITE_PLATFORM as string | undefined) ?? "web";

  if (platform !== "web") {
    // On desktop/phone builds we avoid SSR and prefer SPA on the client.
    // On the server, never execute SPA code.
    return browser ? spaData() : ssrPromise;
  }

  return ssrPromise || !browser ? ssrPromise : spaData();
}
