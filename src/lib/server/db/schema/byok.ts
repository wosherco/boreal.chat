import { pgTable, uuid, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { userTable } from "./users";
import { BYOK_PLATFORMS } from "$lib/common";

export const byokTable = pgTable(
  "byok",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid()
      .notNull()
      .unique()
      .references(() => userTable.id),
    apiKey: text().notNull(),
    platform: varchar({ length: 255, enum: BYOK_PLATFORMS }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.platform)],
);

export type BYOKEntry = typeof byokTable.$inferSelect;
