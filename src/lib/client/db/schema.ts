import { pgTable, real, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS, USER_ROLES } from "../../common";
import { createChatTables } from "../../common/schema/chats";

export const userTable = pgTable("user", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  profilePicture: text(),
  role: varchar({ length: 255, enum: USER_ROLES }).notNull().default("USER"),

  // Payment stuff
  subscribedUntil: timestamp({ withTimezone: true }),
  subscriptionStatus: varchar({
    length: 255,
    enum: SUBSCRIPTION_STATUS,
  }),
  subscriptionPlan: varchar({ length: 50, enum: SUBSCRIPTION_PLANS }),

  // Credit system
  credits: real().notNull().default(0.0),
});

const {
  chatTable,
  threadTable,
  messageTable,
  messageSegmentsTable,
  messageSegmentUsageTable,
} = createChatTables(userTable, true);

export {
  chatTable,
  threadTable,
  messageTable,
  messageSegmentsTable,
  messageSegmentUsageTable,
};
