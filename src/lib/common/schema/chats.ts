import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  boolean,
  foreignKey,
} from "drizzle-orm/pg-core";

import { MESSAGE_SEGMENT_KINDS, MESSAGE_STATUS, MESSAGE_TYPES } from "../index";
import type { userTable } from "../../client/db/schema";
import { MODELS, REASONING_LEVELS, REASONING_NONE } from "../ai/models";

export const createChatTables = (userTableFromSchema: typeof userTable, isClient: boolean) => {
  const chatTable = pgTable(
    "chats",
    {
      id: uuid().defaultRandom().primaryKey(),
      userId: uuid().notNull(),
      title: text(),
      titleManuallyEdited: boolean().notNull().default(false),
      selectedModel: varchar({ length: 50, enum: MODELS }).notNull(),
      reasoningLevel: varchar({ length: 50, enum: REASONING_LEVELS })
        .notNull()
        .default(REASONING_NONE),
      webSearchEnabled: boolean().notNull().default(false),
      createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
      updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      !isClient &&
        foreignKey({
          columns: [t.userId],
          foreignColumns: [userTableFromSchema.id],
        }).onDelete("cascade"),
    ],
  );

  const threadTable = pgTable(
    "threads",
    {
      id: uuid().defaultRandom().primaryKey(),
      userId: uuid().notNull(),
      chatId: uuid().notNull(),
      createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      index().on(t.chatId, t.createdAt),
      !isClient &&
        foreignKey({
          columns: [t.userId],
          foreignColumns: [userTableFromSchema.id],
        }).onDelete("cascade"),
      !isClient &&
        foreignKey({
          columns: [t.chatId],
          foreignColumns: [chatTable.id],
        }).onDelete("cascade"),
    ],
  );

  const messageTable = pgTable(
    "messages",
    {
      id: uuid().defaultRandom().primaryKey(),
      userId: uuid().notNull(),
      chatId: uuid().notNull(),
      threadId: uuid().notNull(),
      parentMessageId: uuid(),
      version: integer().notNull().default(1),
      role: varchar({ length: 50, enum: MESSAGE_TYPES }).notNull(),
      status: varchar({ length: 50, enum: MESSAGE_STATUS }).notNull().default("processing"),
      error: text(),
      metadata: jsonb(),
      model: varchar({ length: 50, enum: MODELS }).notNull(),
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
    (t) => [
      index().on(t.threadId, t.createdAt),
      uniqueIndex().on(t.parentMessageId, t.version),
      !isClient &&
        foreignKey({
          columns: [t.userId],
          foreignColumns: [userTableFromSchema.id],
        }).onDelete("cascade"),
      !isClient &&
        foreignKey({
          columns: [t.chatId],
          foreignColumns: [chatTable.id],
        }).onDelete("cascade"),
      !isClient &&
        foreignKey({
          columns: [t.threadId],
          foreignColumns: [threadTable.id],
        }).onDelete("cascade"),
      !isClient &&
        foreignKey({
          columns: [t.parentMessageId],
          foreignColumns: [t.id],
        }).onDelete("cascade"),
    ],
  );

  const messageSegmentsTable = pgTable(
    "message_segments",
    {
      id: uuid().defaultRandom().primaryKey(),
      userId: uuid().notNull(),
      messageId: uuid().notNull(),
      ordinal: integer().notNull(),
      kind: varchar({ length: 50, enum: MESSAGE_SEGMENT_KINDS }).notNull(),
      content: text(),
      toolName: text(),
      toolArgs: jsonb(),
      toolResult: jsonb(),
      createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      index().on(t.messageId, t.ordinal),
      !isClient &&
        foreignKey({
          columns: [t.userId],
          foreignColumns: [userTableFromSchema.id],
        }).onDelete("cascade"),
      !isClient &&
        foreignKey({
          columns: [t.messageId],
          foreignColumns: [messageTable.id],
        }).onDelete("cascade"),
    ],
  );

  /**
   * THIS TABLE IS MEANT TO BE USED FOR TOKENS WHILE STREAMING. ONCE THE MESSAGE IS DONE, IT WILL BE MOVED TO message_segments.
   */
  const messageTokensTable = pgTable(
    "message_tokens",
    {
      id: uuid().defaultRandom().primaryKey(),
      // We need this here because, for now, we're just filtering syncing by user id.
      userId: uuid().notNull(),
      messageId: uuid().notNull(),
      kind: varchar({ length: 50, enum: MESSAGE_SEGMENT_KINDS }).notNull(),
      tokens: text().notNull(),
      // After 15 minutes we can consider this done.
      createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      !isClient &&
        foreignKey({
          columns: [t.userId],
          foreignColumns: [userTableFromSchema.id],
        }).onDelete("cascade"),
      !isClient &&
        foreignKey({
          columns: [t.messageId],
          foreignColumns: [messageTable.id],
        }).onDelete("cascade"),
    ],
  );

  return {
    chatTable,
    threadTable,
    messageTable,
    messageSegmentsTable,
    messageTokensTable,
  };
};

type ReturnTypeOfTables = ReturnType<typeof createChatTables>;

export type DBMessage = ReturnTypeOfTables["messageTable"]["$inferSelect"];
