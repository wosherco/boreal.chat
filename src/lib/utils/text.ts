/**
 * Truncates a string to a specified maximum length, adding an ellipsis if truncated.
 * @param text - The text to truncate
 * @param maxLength - The maximum length of the text (default: 100)
 * @param ellipsis - The string to append when truncated (default: "...")
 * @returns The truncated text with ellipsis if necessary
 */
export function truncateText(text: string, maxLength = 100, ellipsis = "..."): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + ellipsis;
}

/**
 * Capitalizes the first letter of a string.
 * @param text - The text to capitalize
 * @returns The text with the first letter capitalized
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Converts a camelCase or PascalCase string to a space-separated string.
 * Handles consecutive uppercase letters properly (e.g., "XMLHttpRequest" → "XML Http Request").
 * @param text - The text to convert
 * @returns The text with spaces between words
 */
export function camelCaseToWords(text: string): string {
  return (
    text
      // Insert space between lowercase and uppercase letters
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      // Insert space between consecutive uppercase letters followed by lowercase
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
  );
}

/**
 * Converts a snake_case string to a space-separated string.
 * @param text - The text to convert
 * @returns The text with spaces instead of underscores
 */
export function snakeCaseToWords(text: string): string {
  return text.replace(/_/g, " ");
}

/**
 * Converts a kebab-case string to a space-separated string.
 * @param text - The text to convert
 * @returns The text with spaces instead of hyphens
 */
export function kebabCaseToWords(text: string): string {
  return text.replace(/-/g, " ");
}

/**
 * Pluralizes a word based on a count.
 * @param count - The count to base pluralization on
 * @param singular - The singular form of the word
 * @param plural - The plural form of the word (optional, defaults to singular + "s")
 * @returns The appropriate form of the word
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural || singular + "s";
}

/**
 * Formats a word count with proper pluralization.
 * @param count - The count to format
 * @param singular - The singular form of the word
 * @param plural - The plural form of the word (optional)
 * @returns A formatted string with count and word
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${pluralize(count, singular, plural)}`;
}

/**
 * Extracts initials from a name or text.
 * @param text - The text to extract initials from
 * @param maxInitials - Maximum number of initials to return (default: 2)
 * @returns The initials in uppercase
 */
export function getInitials(text: string, maxInitials = 2): string {
  if (!text) return "";

  const words = text.trim().split(/\s+/);
  const initials = words
    .slice(0, maxInitials)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials;
}

/**
 * Removes HTML tags from a string.
 * @param html - The HTML string to clean
 * @returns The text without HTML tags
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Escapes HTML special characters in a string.
 * @param text - The text to escape
 * @returns The escaped text
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}
