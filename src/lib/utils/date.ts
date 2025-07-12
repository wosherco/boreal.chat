import { format } from "date-fns";

/**
 * Formats a date string to a compact format showing month, day, hour, and minute.
 * @param date - The date string to format
 * @returns A formatted date string in "MMM d, HH:mm" format (e.g., "Jan 15, 14:30")
 */
export function formatDateCompact(date: string): string {
  return format(new Date(date), "MMM d, HH:mm");
}
