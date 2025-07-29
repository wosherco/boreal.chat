import { userTable } from "./users";
import { createFilesTable } from "../../../common/schema/files";
import { pgTable, uuid, text, integer, timestamp, unique, index } from "drizzle-orm/pg-core";
import { messageTable } from "./chats";
import { draftsTable } from "./drafts";

const { assetTable, draftAttachmentTable, messageAttachmentTable } = createFilesTable(
  messageTable,
  draftsTable,
  false,
);

export { assetTable, draftAttachmentTable, messageAttachmentTable };

export const s3FileTable = pgTable(
  "s3_file",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),

    // S3 Details
    key: text().notNull().unique(),
    fileName: text().notNull(),
    size: integer().notNull(),
    contentType: text().notNull(),
    hash: text(),

    // Extra details
    thumbnailKey: text(),
    aiFileKey: text(),

    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.hash, t.userId), index().on(t.userId)],
);
