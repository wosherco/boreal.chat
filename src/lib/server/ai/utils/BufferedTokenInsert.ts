import type { MessageSegmentKind } from "$lib/common";
import { db } from "$lib/server/db";
import { messageTokensTable } from "$lib/server/db/schema";
import PQueue from "p-queue";

interface TokenData {
  generationId: string;
  kind: MessageSegmentKind;
  content: string;
}

interface FlushData {
  generationId: string;
  kind: MessageSegmentKind;
  content: string;
  timestamp: Date;
}

class BufferedTokenInsert {
  private userId: string;
  private messageId: string;

  private currentKind: MessageSegmentKind | null = null;
  private currentGenerationId: string | null = null;
  private queue: PQueue;
  private lastInsert: number = 0;
  private buffer: string = "";
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_TIMEOUT = 400; // 400ms
  private readonly BUFFER_THRESHOLD = 100; // characters threshold
  private readonly BATCH_FLUSH_DELAY = 10; // 10ms to collect batches
  private isDestroyed = false;

  // Batching mechanism
  private pendingFlushes: FlushData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  constructor(userId: string, messageId: string) {
    this.userId = userId;
    this.messageId = messageId;
    this.queue = new PQueue({ concurrency: 1 });
  }

  /**
   * Insert a token with the specified kind and content
   */
  async insert(generationId: string, kind: MessageSegmentKind, content: string): Promise<void> {
    if (this.isDestroyed) {
      throw new Error("BufferedTokenInsert has been destroyed");
    }

    return this.queue.add(async () => {
      await this.processToken({ generationId, kind, content });
    });
  }

  private async processToken(tokenData: TokenData): Promise<void> {
    const { generationId, kind, content } = tokenData;
    const now = Date.now();

    // Check if kind has changed and we need to flush
    if (
      (this.currentKind !== null && this.currentKind !== kind) ||
      (this.currentGenerationId !== null && this.currentGenerationId !== generationId)
    ) {
      await this.scheduleFlush();
    }

    // Update current kind and add content to buffer
    this.currentKind = kind;
    this.currentGenerationId = generationId;
    this.buffer += content;
    this.lastInsert = now;

    // Clear existing timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    // Check if buffer threshold is reached
    if (this.buffer.length >= this.BUFFER_THRESHOLD) {
      await this.scheduleFlush();
      return;
    }

    // Set up timer for 400ms flush
    this.flushTimer = setTimeout(async () => {
      if (this.buffer.length > 0) {
        await this.queue.add(async () => {
          await this.scheduleFlush();
        });
      }
    }, this.FLUSH_TIMEOUT);
  }

  /**
   * Manually trigger a flush of the current buffer
   */
  async flush(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    return this.queue.add(async () => {
      await this.scheduleFlush();
    });
  }

  private async scheduleFlush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    // Clear the timer since we're flushing
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const flushData: FlushData = {
      generationId: this.currentGenerationId!,
      kind: this.currentKind!,
      content: this.buffer,
      timestamp: new Date(),
    };

    // Add to pending flushes
    this.pendingFlushes.push(flushData);

    // Reset buffer
    this.buffer = "";

    // If no batch timer is running, start one
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(async () => {
        await this.queue.add(async () => {
          await this.processBatchedFlushes();
        });
      }, this.BATCH_FLUSH_DELAY);
    }
  }

  private async processBatchedFlushes(): Promise<void> {
    if (this.pendingFlushes.length === 0) {
      return;
    }

    // Clear the batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Get all pending flushes
    const flushBatch = [...this.pendingFlushes];
    this.pendingFlushes = [];

    await db.insert(messageTokensTable).values(
      flushBatch.map((flush) => ({
        userId: this.userId,
        messageId: this.messageId,
        generationId: flush.generationId,
        kind: flush.kind,
        tokens: flush.content,
        createdAt: flush.timestamp,
      })),
    );

    /*
		if (flushBatch.length === 1) {
			const { kind, content } = flushBatch[0];
			console.log(`Flushing single buffer of kind ${kind}: "${content}"`);
		} else {
			console.log(`Flushing batch of ${flushBatch.length} buffers:`);
			flushBatch.forEach((flush, index) => {
				console.log(`  [${index}] ${flush.kind}: "${flush.content}"`);
			});
		}
			*/
  }

  /**
   * Force immediate flush of any pending batches
   */
  async flushImmediate(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    return this.queue.add(async () => {
      // First flush current buffer if any
      if (this.buffer.length > 0) {
        await this.scheduleFlush();
      }

      // Then immediately process any pending batches
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
        await this.processBatchedFlushes();
      }
    });
  }

  /**
   * Destroy the buffer, flush remaining content, and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    // Clear any pending timers
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Add final flush operations to queue
    await this.queue.add(async () => {
      // Flush current buffer if any
      if (this.buffer.length > 0) {
        await this.scheduleFlush();
      }

      // Process any remaining batched flushes
      await this.processBatchedFlushes();
    });

    // Wait for queue to be empty
    await this.queue.onIdle();

    // Clear the queue
    this.queue.clear();
  }

  /**
   * Get current buffer status for debugging
   */
  getStatus() {
    return {
      currentKind: this.currentKind,
      currentGenerationId: this.currentGenerationId,
      bufferLength: this.buffer.length,
      queueSize: this.queue.size,
      queuePending: this.queue.pending,
      pendingFlushes: this.pendingFlushes.length,
      isDestroyed: this.isDestroyed,
      lastInsert: this.lastInsert,
    };
  }
}

export default BufferedTokenInsert;
