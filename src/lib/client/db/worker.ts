import { PGlite } from "@electric-sql/pglite";
import { worker } from "@electric-sql/pglite/worker";

worker({
  async init(options) {
    return new PGlite("idb://borealchat-syncdata", options);
    // return new PGlite('opfs-ahp://borealchat-syncdata', options);
  },
});
