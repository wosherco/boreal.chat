import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  boolean,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";
import type { userTable } from "../../client/db/schema";
import { MODELS, REASONING_LEVELS, REASONING_NONE } from "../ai/models";

export const createDraftsTable = (userTableFromSchema: typeof userTable, isClient: boolean) => {
  const draftsTable = pgTable(
    "drafts",
    {
      id: uuid().defaultRandom().primaryKey(),
      userId: uuid().notNull(),
      content: text().notNull(),
      selectedModel: varchar({ length: 50, enum: MODELS }).notNull(),
      reasoningLevel: varchar({ length: 50, enum: REASONING_LEVELS })
        .notNull()
        .default(REASONING_NONE),
      webSearchEnabled: boolean().notNull().default(false),
      createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdateFn(() => new Date()),
    },
    (t: any) => [
      index().on(t.userId, t.updatedAt),
      !isClient &&
        foreignKey({
          columns: [t.userId],
          foreignColumns: [userTableFromSchema.id],
        }).onDelete("cascade"),
    ],
  );

  return {
    draftsTable,
  };
};

type ReturnTypeOfDraftsTable = ReturnType<typeof createDraftsTable>;

export type DBDraft = ReturnTypeOfDraftsTable["draftsTable"]["$inferSelect"];
export type NewDBDraft = ReturnTypeOfDraftsTable["draftsTable"]["$inferInsert"];