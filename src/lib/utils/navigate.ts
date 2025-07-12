import { goto } from "$app/navigation";

/**
 * Ensures the provided URL is a URL object.
 * @param url - The URL as a string or URL object
 * @returns A URL object
 */
export function ensureURL(url: string | URL) {
  if (typeof url === "string") {
    return new URL(url);
  }
  return url;
}

/**
 * Navigate to a URL with search parameters management.
 * Preserves existing search parameters and allows adding, updating, or deleting them.
 * @param to - The destination URL (string or URL object)
 * @param params - Navigation parameters including optional searchParams
 * @param params.searchParams - Record of search parameters to add, update, or delete.
 *                              If value is undefined, the parameter is deleted.
 *                              If value is a string, the parameter is set or updated.
 * @returns Promise from the goto function
 */
export function gotoWithSeachParams(
  to: Parameters<typeof goto>[0],
  params: Parameters<typeof goto>[1] & {
    searchParams?: Record<string, string | undefined>;
  },
) {
  const { searchParams, ...rest } = params;
  const url = ensureURL(to);

  const searchParamsToAdd = url.searchParams;
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined) {
      searchParamsToAdd.set(key, value);
    } else {
      searchParamsToAdd.delete(key);
    }
  }

  return goto(url, rest);
}
