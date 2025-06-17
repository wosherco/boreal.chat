import { PGlite } from "@electric-sql/pglite";
import { worker } from "@electric-sql/pglite/worker";

worker({
  async init(options) {
    return new PGlite("idb://plchat-syncdata", options);
    // return new PGlite('opfs-ahp://plchat-syncdata', options);
  },
});
