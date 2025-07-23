import { db } from "$lib/server/db";
import { permanentlyDeleteExpiredChats } from "./chat";

export class CronService {
  private interval: NodeJS.Timeout | null = null;
  private initialTimeout: NodeJS.Timeout | null = null;

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
      if (currentMinutes < 30) {
        nextRun.setMinutes(30, 0, 0);
      } else {
        nextRun.setHours(now.getHours() + 1, 0, 0, 0);
      }

      let delay = nextRun.getTime() - now.getTime();
      delay = Math.max(0, delay); // Clamp to avoid negative delays

      // Clear any previous scheduled timeout
      if (this.interval) {
        clearTimeout(this.interval);
      }

      this.interval = setTimeout(async () => {
        try {
          console.log("[CRON] Starting cleanup of expired deleted chats...");
          await permanentlyDeleteExpiredChats(db);
          console.log("[CRON] Cleanup completed successfully");
        } catch (error) {
          console.error("[CRON] Error during cleanup:", error);
        }
        // Schedule the next run based on fixed :00/:30 marks
        scheduleNextRun();
      }, delay);
    };

    // Start the cron-like scheduling
    scheduleNextRun();

    // Also run immediately on startup (after 5s)
    this.initialTimeout = setTimeout(async () => {
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
    if (this.interval) {
      clearTimeout(this.interval);
      this.interval = null;
    }
    if (this.initialTimeout) {
      clearTimeout(this.initialTimeout);
      this.initialTimeout = null;
    }
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
