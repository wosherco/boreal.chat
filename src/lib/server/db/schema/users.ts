import { SUBSCRIPTION_STATUS, SUBSCRIPTION_PLANS, USER_ROLES } from "../../../common";
import {
  boolean,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  profilePicture: text(),
  role: varchar({ length: 255, enum: USER_ROLES }).notNull().default("USER"),

  // Payment stuff
  stripeCustomerId: text().unique(),
  subscriptionId: text().unique(),
  subscriptionPlan: varchar({ length: 50, enum: SUBSCRIPTION_PLANS }),
  subscribedUntil: timestamp({ withTimezone: true }),
  subscriptionStatus: varchar({
    length: 255,
    enum: SUBSCRIPTION_STATUS,
  }),

  // Credit system
  credits: real().notNull().default(0.0),
});

export const creditTransactionTable = pgTable("credit_transaction", {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  amount: real().notNull(),
  stripeCheckoutSessionId: text().notNull().unique(),
  added: boolean().notNull().default(false),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
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
