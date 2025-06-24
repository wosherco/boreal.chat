import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { USER_ROLES } from "../../common";
import { createChatTables } from "../../common/schema/chats";

export const userTable = pgTable("user", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  profilePicture: text(),
  role: varchar({ length: 255, enum: USER_ROLES }).notNull().default("USER"),

  // Payment stuff
  subscribedUntil: timestamp({ withTimezone: true }),
});

const {
  chatTable,
  threadTable,
  messageTable,
  messageSegmentsTable,
  messageTokensTable,
  messageSegmentUsageTable,
} = createChatTables(userTable, true);

export {
  chatTable,
  threadTable,
  messageTable,
  messageSegmentsTable,
  messageTokensTable,
  messageSegmentUsageTable,
};
