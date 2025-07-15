import { pgTable, text, timestamp, uuid, varchar, decimal } from "drizzle-orm/pg-core";
import { USER_ROLES } from "../../common";
import { createChatTables } from "../../common/schema/chats";
import { createDraftsTable } from "../../common/schema/drafts";

export const userTable = pgTable("user", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  profilePicture: text(),
  role: varchar({ length: 255, enum: USER_ROLES }).notNull().default("USER"),

  // Payment stuff
  stripeCustomerId: text().unique(),
  
  // Credits
  credits: decimal({ precision: 10, scale: 2 }).default("0.00"),
});

const { chatTable, threadTable, messageTable, messageSegmentsTable, messageSegmentUsageTable } =
  createChatTables(userTable, true);

const { draftsTable } = createDraftsTable(userTable, true);

export {
  chatTable,
  threadTable,
  messageTable,
  messageSegmentsTable,
  messageSegmentUsageTable,
  draftsTable,
};
