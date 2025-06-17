import { toCamelCase } from "drizzle-orm/casing";

/**
 * Recursively transforms all object keys to camelCase
 * Optimized for performance with minimal object creation
 */
export function transformKeyToCamelCaseRecursive(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitive types, Dates, and other non-plain objects
  if (
    typeof obj !== "object" ||
    obj instanceof Date ||
    !obj.constructor ||
    obj.constructor !== Object
  ) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => transformKeyToCamelCaseRecursive(item));
  }

  // Handle objects
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = toCamelCase(key);
      const value = obj[key];
      result[camelKey] = transformKeyToCamelCaseRecursive(value);
    }
  }

  return result;
}
