import { invalidateAll } from "$app/navigation";
import { getAllCacheValues } from "../hooks/localDbHook";
import { LocalDatabase } from "./LocalDatabase.svelte";

let currentDbInstance = $state<LocalDatabase | null>(null);

export const getDbInstance = () => {
  if (!currentDbInstance) {
    throw new Error("DB instance not initialized");
  }
  return currentDbInstance;
};

/**
 * ⚠️ THIS IS REALLY DANGEROUS AND SHOULD NOT BE CALLED
 */
export async function resetDatabaseInstance() {
  console.log("Resetting database instance");
  if (currentDbInstance) {
    await currentDbInstance.destroy();

    // TODO: instead of reloading the page, we should just reset the database instance, but that's not reactive for now
    window.location.reload();
    return;
  }

  currentDbInstance = new LocalDatabase();

  await invalidateAll();
  await getAllCacheValues().forEach((store) => store.refreshQuery());
}
