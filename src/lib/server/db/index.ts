import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "$env/dynamic/private";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

export const sql = postgres(env.DATABASE_URL);
export const db = drizzle(sql, {
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
