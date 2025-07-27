import { userTable } from "./users";
import { createFilesTable } from "../../../common/schema/files";
import { pgTable, uuid, text, integer, timestamp, unique } from "drizzle-orm/pg-core";

const { assetTable, draftAttachmentTable, messageAttachmentTable } = createFilesTable(
  userTable,
  false,
);

export { assetTable, draftAttachmentTable, messageAttachmentTable };

export const s3FileTable = pgTable(
  "s3_file",
  {
    id: uuid().defaultRandom().primaryKey(),
    userId: uuid()
      .notNull()
      .references(() => userTable.id),

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
  (t) => [unique().on(t.hash, t.userId)],
);
