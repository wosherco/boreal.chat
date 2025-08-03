import { PGlite } from "@electric-sql/pglite";
import { LeaderChangedError, worker } from "@electric-sql/pglite/worker";

worker({
  async init(options) {
    return new PGlite("idb://borealchat-syncdata", options);
    // return new PGlite('opfs-ahp://borealchat-syncdata', options);
  },
}).catch((error) => {
  if (error instanceof LeaderChangedError) {
    console.error("WORKER LEADER ERROR", error);
  } else {
    throw error;
  }
});
