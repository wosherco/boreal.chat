import { pgTable, uuid, text, foreignKey, varchar, unique, index } from "drizzle-orm/pg-core";
import type { draftsTable, messageTable } from "../../client/db/schema";
import { ASSET_TYPES } from "..";

export const createFilesTable = (
  messageTableFromSchema: typeof messageTable,
  draftsTableFromSchema: typeof draftsTable,
  isClient: boolean,
) => {
  const assetTable = pgTable(
    "assets",
    {
      id: uuid().defaultRandom().primaryKey(),
      userId: uuid().notNull(),

      assetType: varchar({ length: 50, enum: ASSET_TYPES }).notNull(),
      assetId: uuid().notNull(),

      name: text().notNull(),
    },
    (t) => [index().on(t.assetId), unique().on(t.assetId, t.assetType)],
  );

  const draftAttachmentTable = pgTable(
    "draft_attachments",
    {
      id: uuid().defaultRandom().primaryKey(),
      draftId: uuid().notNull(),
      assetId: uuid().notNull(),
    },
    (t) => [
      !isClient &&
        foreignKey({
          columns: [t.draftId],
          foreignColumns: [draftsTableFromSchema.id],
        }).onDelete("cascade"),
      !isClient &&
        foreignKey({
          columns: [t.assetId],
          foreignColumns: [assetTable.id],
        }).onDelete("cascade"),
    ],
  );

  const messageAttachmentTable = pgTable(
    "message_attachments",
    {
      id: uuid().defaultRandom().primaryKey(),
      messageId: uuid().notNull(),
      assetId: uuid().notNull(),
    },
    (t) => [
      !isClient &&
        foreignKey({
          columns: [t.messageId],
          foreignColumns: [messageTableFromSchema.id],
        }).onDelete("cascade"),
      !isClient &&
        foreignKey({
          columns: [t.assetId],
          foreignColumns: [assetTable.id],
        }).onDelete("cascade"),
    ],
  );

  return {
    assetTable,
    draftAttachmentTable,
    messageAttachmentTable,
  };
};

type ReturnTypeOfFilesTable = ReturnType<typeof createFilesTable>;

export type DBAsset = ReturnTypeOfFilesTable["assetTable"]["$inferSelect"];
export type NewDBAsset = ReturnTypeOfFilesTable["assetTable"]["$inferInsert"];

export type DBDraftAttachment = ReturnTypeOfFilesTable["draftAttachmentTable"]["$inferSelect"];
export type NewDBDraftAttachment = ReturnTypeOfFilesTable["draftAttachmentTable"]["$inferInsert"];

export type DBMessageAttachment = ReturnTypeOfFilesTable["messageAttachmentTable"]["$inferSelect"];
export type NewDBMessageAttachment =
  ReturnTypeOfFilesTable["messageAttachmentTable"]["$inferInsert"];
