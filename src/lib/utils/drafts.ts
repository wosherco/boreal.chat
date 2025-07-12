/**
 * Extracts the draft ID from a URL's search parameters.
 * @param url - The URL object to extract the draft ID from
 * @returns The draft ID string if the 'draft' parameter exists, null otherwise
 */
export function getDraftIdFromUrl(url: URL) {
  return url.searchParams.get("draft");
}
