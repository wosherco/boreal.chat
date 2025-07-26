import { pgTable, uuid, text, timestamp, varchar, unique } from "drizzle-orm/pg-core";
import type { userTable } from "../../client/db/schema";
import { BYOK_PLATFORMS } from "..";

export const createByokTable = (userTableFromSchema: typeof userTable, isClient: boolean) => {
  const byokTable = pgTable(
    "byok",
    {
      id: uuid().defaultRandom().primaryKey(),
      userId: uuid()
        .notNull()
        .references(() => userTableFromSchema.id),
      apiKey: text().notNull(),
      platform: varchar({ length: 255, enum: BYOK_PLATFORMS }).notNull(),
      createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    },
    (t) => [!isClient && unique().on(t.userId, t.platform)],
  );

  return {
    byokTable,
  };
};

type ReturnTypeOfByokTable = ReturnType<typeof createByokTable>;

export type DBByok = ReturnTypeOfByokTable["byokTable"]["$inferSelect"];
export type NewDBByok = ReturnTypeOfByokTable["byokTable"]["$inferInsert"];
