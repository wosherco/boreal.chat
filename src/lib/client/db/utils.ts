import { getTableColumns, Table } from "drizzle-orm";
import { toSnakeCase } from "drizzle-orm/casing";

export function getTableColumnNames(table: Table) {
  return Object.values(getTableColumns(table)).map((c) => toSnakeCase(c.name));
}
