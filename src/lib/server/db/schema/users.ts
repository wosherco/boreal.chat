import { USER_ROLES } from "../../../common";
import { pgTable, serial, text, timestamp, uuid, varchar, decimal } from "drizzle-orm/pg-core";

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
