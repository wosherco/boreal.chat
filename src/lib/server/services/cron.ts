import { db } from "$lib/server/db";
import { permanentlyDeleteExpiredChats } from "./chat";

export class CronService {
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.startCleanupJob();
  }

  private startCleanupJob() {
    // Run cleanup every 6 hours (21600000 ms = 6 * 60 * 60 * 1000)
    const cleanupInterval = setInterval(async () => {
      try {
        console.log("[CRON] Starting cleanup of expired deleted chats...");
        await permanentlyDeleteExpiredChats(db);
        console.log("[CRON] Cleanup completed successfully");
      } catch (error) {
        console.error("[CRON] Error during cleanup:", error);
      }
    }, 21600000); // 6 hours

    this.intervals.push(cleanupInterval);

    // Also run immediately on startup
    setTimeout(async () => {
      try {
        console.log("[CRON] Running initial cleanup on startup...");
        await permanentlyDeleteExpiredChats(db);
        console.log("[CRON] Initial cleanup completed");
      } catch (error) {
        console.error("[CRON] Error during initial cleanup:", error);
      }
    }, 5000); // Wait 5 seconds after startup
  }

  stop() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    console.log("[CRON] All cron jobs stopped");
  }
}

let cronService: CronService | null = null;

export function startCronJobs() {
  if (!cronService) {
    cronService = new CronService();
    console.log("[CRON] Cron jobs started");
  }
}

export function stopCronJobs() {
  if (cronService) {
    cronService.stop();
    cronService = null;
  }
}