import { bytea } from "../../../common/db/bytea";
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_PLANS, USER_ROLES } from "../../../common";
import {
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  profilePicture: text(),
  role: varchar({ length: 255, enum: USER_ROLES }).notNull().default("ANONYMOUS"),
  emailVerified: boolean().notNull().default(false),
  passwordHash: text(),
  recoveryCode: bytea(),

  // Payment stuff
  stripeCustomerId: text().unique(),
  subscriptionId: text().unique(),
  subscriptionPlan: varchar({ length: 50, enum: SUBSCRIPTION_PLANS }),
  subscribedUntil: timestamp({ withTimezone: true }),
  subscriptionStatus: varchar({
    length: 255,
    enum: SUBSCRIPTION_STATUS,
  }),
});

export const sessionTable = pgTable("session", {
  id: text().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
  twoFactorVerified: boolean().notNull().default(false),

  captchaVerifiedAt: timestamp({ withTimezone: true }),
  verifiedClientIp: text(),
});

export const emailVerificationRequestTable = pgTable("email_verification_request", {
  id: text().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  email: text().notNull(),
  code: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
});

export const passwordResetSessionTable = pgTable("password_reset_session", {
  id: text().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  email: text().notNull(),
  code: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  emailVerified: boolean().notNull().default(false),
  twoFactorVerified: boolean().notNull().default(false),
});

export const totpCredentialTable = pgTable("totp_credential", {
  id: serial().primaryKey(),
  userId: uuid()
    .notNull()
    .unique()
    .references(() => userTable.id),
  key: bytea().notNull(),
});

export const passkeyCredentialTable = pgTable("passkey_credential", {
  id: bytea().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  name: text().notNull(),
  algorithm: integer().notNull(),
  publicKey: bytea().notNull(),
});

export const securityKeyCredentialTable = pgTable("security_key_credential", {
  id: bytea().primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id),
  name: text().notNull(),
  algorithm: integer().notNull(),
  publicKey: bytea().notNull(),
});

export const webauthnChallengeTable = pgTable("webauthn_challenge", {
  id: uuid().defaultRandom().primaryKey(),
  challenge: text().notNull().unique(),
  clientIp: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
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
