import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { userTable } from "./users";
import { chatTable, threadTable, messageTable } from "./chats";
import { SHARE_PRIVACY_OPTIONS } from "$lib/common";

export const messageShareTable = pgTable("message_share", {
  id: varchar({ length: 21 }).primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  messageId: uuid()
    .notNull()
    .references(() => messageTable.id, { onDelete: "cascade" }),
  privacy: varchar({ length: 20, enum: SHARE_PRIVACY_OPTIONS }).notNull().default("private"),
  allowedEmails: text("allowed_emails").array().notNull().default([]),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const threadShareTable = pgTable("thread_share", {
  id: varchar({ length: 21 }).primaryKey(),
  userId: uuid()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  threadId: uuid()
    .notNull()
    .references(() => threadTable.id, { onDelete: "cascade" }),
  lastMessageId: uuid()
    .notNull()
    .references(() => messageTable.id, { onDelete: "cascade" }),
  privacy: varchar({ length: 20, enum: SHARE_PRIVACY_OPTIONS }).notNull().default("private"),
  allowedEmails: text("allowed_emails").array().notNull().default([]),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const chatShareTable = pgTable("chat_share", {
  chatId: uuid()
    .primaryKey()
    .references(() => chatTable.id, { onDelete: "cascade" }),
  userId: uuid()
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  privacy: varchar({ length: 20, enum: SHARE_PRIVACY_OPTIONS }).notNull().default("private"),
  allowedEmails: text("allowed_emails").array().notNull().default([]),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export type MessageShare = typeof messageShareTable.$inferSelect;
export type ThreadShare = typeof threadShareTable.$inferSelect;
export type ChatShare = typeof chatShareTable.$inferSelect;
