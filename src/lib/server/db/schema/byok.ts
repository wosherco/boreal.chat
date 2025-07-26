import { userTable } from "./users";
import { createByokTable } from "../../../common/schema/byok";

const { byokTable } = createByokTable(userTable, false);

export { byokTable };
