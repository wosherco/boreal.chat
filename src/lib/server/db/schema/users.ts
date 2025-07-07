import { SUBSCRIPTION_STATUS, USER_ROLES } from "../../../common";
import { pgTable, serial, text, timestamp, uuid, varchar, integer } from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  profilePicture: text(),
  role: varchar({ length: 255, enum: USER_ROLES }).notNull().default("USER"),

  // Payment stuff
  stripeCustomerId: text().unique(),
  subscriptionId: text().unique(),
  subscribedUntil: timestamp({ withTimezone: true }),
  subscriptionStatus: varchar({
    length: 255,
    enum: SUBSCRIPTION_STATUS,
  }),

  // Credit system
  credits: integer().notNull().default(0),
  totalCreditsEarned: integer().notNull().default(0),
  totalCreditsUsed: integer().notNull().default(0),
});

export const sessionTable = pgTable("session", {
  id: text().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
});

export type Session = typeof sessionTable.$inferSelect;

export type User = typeof userTable.$inferSelect;

export const OAUTH_ACCOUNTS = ["GOOGLE"] as const;

export const accountTable = pgTable("account", {
  id: serial().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  platform: varchar({ length: 255, enum: OAUTH_ACCOUNTS }),
  platformId: text().notNull().unique(),
  profilePicture: text(),
});

export type UserAccount = typeof accountTable.$inferSelect;

// Credit transactions table for tracking credit usage and purchases
export const creditTransactionTable = pgTable("credit_transaction", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  type: varchar({ length: 50, enum: ["purchase", "usage", "bonus", "refund"] }).notNull(),
  amount: integer().notNull(), // positive for credits added, negative for credits used
  description: text().notNull(),
  messageId: uuid(), // reference to message if this is a usage transaction
  stripePaymentIntentId: text(), // reference to Stripe payment if this is a purchase
  couponCode: text(), // coupon code used for this transaction
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
