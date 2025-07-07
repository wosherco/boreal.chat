import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "$env/dynamic/private";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { sql, type ExtractTablesWithRelations } from "drizzle-orm";
import type { AnyPgColumn, PgTransaction } from "drizzle-orm/pg-core";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

export const postgresClient = postgres(env.DATABASE_URL);
export const db = drizzle(postgresClient, {
  schema,
  casing: "snake_case",
});

export type DBType = typeof db;
export type TransactionClient = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export type TransactableDBType = TransactionClient | typeof db;

export const increment = (column: AnyPgColumn, value = 1) => {
  return sql`${column} + ${value}`;
};
