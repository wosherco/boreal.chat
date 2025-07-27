import { userTable } from "./users";
import { createFilesTable } from "../../../common/schema/files";

const { s3FileTable, assetTable, draftAttachmentTable, messageAttachmentTable } = createFilesTable(
  userTable,
  false,
);

export { s3FileTable, assetTable, draftAttachmentTable, messageAttachmentTable };
