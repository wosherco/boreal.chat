/**
 * Cleans a file name by keeping dashes, underscores, numbers, letters, and file extensions.
 * @param fileName - The file name to clean.
 * @returns The cleaned file name.
 */
export function cleanFileName(fileName: string) {
  // Keep alphanumeric characters, dashes, underscores, and dots (for extensions)
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "");
}
