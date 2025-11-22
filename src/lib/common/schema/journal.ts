import { pgTable, uuid, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import type { userTable } from "../../client/db/schema";

export const createJournalTable = (userTableFromSchema: typeof userTable, isClient: boolean) => {
  const journalTable = pgTable(
    "journal_entries",
    {
      id: uuid().defaultRandom().primaryKey(),
      userId: uuid().notNull(),
      title: text(),
      content: text().notNull(),
      mood: integer(), // Scale of 1-10 for emotional state
      tags: text(), // Comma-separated tags
      createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      !isClient && {
        userIdIdx: index("journal_user_id_idx").on(t.userId),
        createdAtIdx: index("journal_created_at_idx").on(t.createdAt),
      },
    ],
  );

  return { journalTable };
};