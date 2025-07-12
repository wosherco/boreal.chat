import { createDraftsTable } from "../../../common/schema/drafts";
import { userTable } from "./users";

const { draftsTable } = createDraftsTable(userTable, false);

export { draftsTable };
