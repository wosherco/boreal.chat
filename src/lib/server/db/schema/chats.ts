import { createChatTables } from "../../../common/schema/chats";
import { userTable } from "./users";

const {
  chatTable,
  threadTable,
  messageTable,
  messageSegmentsTable,
  messageSegmentMetadataTable,
  messageTokensTable,
} = createChatTables(userTable, false);

export {
  chatTable,
  threadTable,
  messageTable,
  messageSegmentsTable,
  messageSegmentMetadataTable,
  messageTokensTable,
};
