import { invalidateAll } from "$app/navigation";
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
  }

  currentDbInstance = new LocalDatabase();

  await invalidateAll();
}
