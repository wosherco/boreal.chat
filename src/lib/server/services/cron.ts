import { db } from "$lib/server/db";
import { permanentlyDeleteExpiredChats } from "./chat";

export class CronService {
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.startCleanupJob();
  }

  private startCleanupJob() {
    // Run cleanup every 30 minutes using cron-like scheduling
    const scheduleNextRun = () => {
      const now = new Date();
      const nextRun = new Date(now);

      // Set to the next 30-minute mark (0 or 30)
      const currentMinutes = now.getMinutes();
      const nextMinutes = currentMinutes < 30 ? 30 : 0;

      if (nextMinutes === 0) {
        // If we're past 30, go to the next hour
        nextRun.setHours(now.getHours() + 1, 0, 0, 0);
      } else {
        nextRun.setMinutes(30, 0, 0);
      }

      const delay = nextRun.getTime() - now.getTime();

      const timeout = setTimeout(async () => {
        try {
          console.log("[CRON] Starting cleanup of expired deleted chats...");
          await permanentlyDeleteExpiredChats(db);
          console.log("[CRON] Cleanup completed successfully");
        } catch (error) {
          console.error("[CRON] Error during cleanup:", error);
        }

        // Schedule the next run
        scheduleNextRun();
      }, delay);

      this.intervals.push(timeout);
    };

    // Start the cron-like scheduling
    scheduleNextRun();

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
    this.intervals.forEach(clearTimeout);
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
