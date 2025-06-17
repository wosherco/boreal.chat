import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { userTable } from "./users";

export const openRouterKeyTable = pgTable("openrouter_key", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .unique()
    .references(() => userTable.id),
  openRouterUserId: text().notNull(),
  apiKey: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type OpenRouterKey = typeof openRouterKeyTable.$inferSelect;
