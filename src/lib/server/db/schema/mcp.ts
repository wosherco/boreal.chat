import { pgTable, uuid, text, jsonb, timestamp, boolean, foreignKey } from "drizzle-orm/pg-core";
import { userTable } from "./users";

export const mcpServerTable = pgTable(
  "mcp_servers",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid().notNull(),
    name: text().notNull(),
    description: text(),
    url: text(),
    command: text(),
    args: jsonb(),
    transport: text().notNull(), // 'stdio' | 'streamable_http'
    apiKey: text(), // encrypted
    authMethod: text().notNull().default("api_key"), // 'api_key' | 'none'
    enabled: boolean().notNull().default(true),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.userId],
      foreignColumns: [userTable.id],
    }).onDelete("cascade"),
  ],
);

export type MCPServer = typeof mcpServerTable.$inferSelect;
export type MCPServerInsert = typeof mcpServerTable.$inferInsert;