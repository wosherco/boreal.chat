import { db } from "$lib/server/db";
import { messageSegmentsTable } from "$lib/server/db/schema/chats";
import { eq, sql } from "drizzle-orm";
import Bottleneck from "bottleneck";
import type { MessageSegmentKind } from "$lib/common";
import * as Sentry from "@sentry/sveltekit";

const FLUSH_INTERVAL_MS = 150;

interface TokenData {
  generationId: string;
  kind: MessageSegmentKind;
  content: string;
}

interface CurrentSegment {
  id: string;
  generationId: string;
  kind: MessageSegmentKind;
}

class BufferedTokenInsert {
  private userId: string;
  private messageId: string;

  private limiter: Bottleneck;
  private buffer: string = "";
  private isDestroyed = false;

  private segmentOrdinal = 0;
  private currentSegment: CurrentSegment | null = null;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(userId: string, messageId: string, initialOrdinal = 0) {
    this.userId = userId;
    this.messageId = messageId;
    this.segmentOrdinal = initialOrdinal;

    this.limiter = new Bottleneck({
      maxConcurrent: 1,
    });

    // Stop any further processing if the instance is destroyed.
    this.limiter.on("empty", () => {
      if (this.isDestroyed) {
        this.limiter.disconnect();
      }
    });
  }

  async insert(generationId: string, kind: MessageSegmentKind, content: string): Promise<void> {
    if (this.isDestroyed) {
      // Don't throw here, just ignore inserts after destruction.
      return;
    }

    // Schedule the token processing. Bottleneck ensures this runs serially.
    return this.limiter.schedule(() => this.processToken({ generationId, kind, content }));
  }

  private async processToken(tokenData: TokenData): Promise<void> {
    const { generationId, kind, content } = tokenData;

    const isNewSegment =
      this.currentSegment === null ||
      this.currentSegment.kind !== kind ||
      this.currentSegment.generationId !== generationId;

    if (isNewSegment) {
      // The kind has changed. We need to flush immediately, finalize the old segment,
      // and create a new one. This all happens as one atomic job in the queue.
      await this.flush(); // Flush any remaining content from the old segment
      await this.finalizeAndCreateNewSegment(generationId, kind);
    }

    this.buffer += content;

    // If a flush is already scheduled, don't schedule another one.
    // Let the existing timer handle the next flush.
    if (!this.flushTimer) {
      this.scheduleFlush();
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    this.flushTimer = setTimeout(() => {
      // Schedule the flush operation on the limiter to ensure it doesn't
      // run concurrently with a processToken operation.
      this.limiter.schedule(() => this.flush());
    }, FLUSH_INTERVAL_MS);
  }

  private async finalizeCurrentSegment(): Promise<void> {
    if (!this.currentSegment) {
      return;
    }

    // Ensure any buffered content is written before finalizing.
    await this.flush();

    // Mark the segment as no longer streaming.
    await db
      .update(messageSegmentsTable)
      .set({ streaming: false })
      .where(eq(messageSegmentsTable.id, this.currentSegment.id));

    this.currentSegment = null;
  }

  private async finalizeAndCreateNewSegment(
    generationId: string,
    kind: MessageSegmentKind,
  ): Promise<void> {
    // This function assumes any pending flush for the old segment has already happened.
    await this.finalizeCurrentSegment();

    this.segmentOrdinal++;

    const [newSegment] = await db
      .insert(messageSegmentsTable)
      .values({
        userId: this.userId,
        messageId: this.messageId,
        generationId,
        kind,
        ordinal: this.segmentOrdinal,
        content: "", // Start with empty content
        streaming: true,
      })
      .returning({ id: messageSegmentsTable.id });

    this.currentSegment = { id: newSegment.id, generationId, kind };
  }

  async flush(): Promise<void> {
    // Clear any pending scheduled flush since we are flushing now.
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.buffer.length === 0 || !this.currentSegment) {
      return;
    }

    const contentToAppend = this.buffer;
    this.buffer = ""; // Clear buffer immediately.

    try {
      await db
        .update(messageSegmentsTable)
        .set({
          content: sql`${messageSegmentsTable.content} || ${contentToAppend}`,
        })
        .where(eq(messageSegmentsTable.id, this.currentSegment.id));
    } catch (e) {
      // If the DB update fails, restore the buffer so we can retry.
      this.buffer = contentToAppend + this.buffer;
      Sentry.captureException(e, {
        extra: {
          messageId: this.messageId,
          generationId: this.currentSegment.generationId,
          segmentId: this.currentSegment.id,
          kind: this.currentSegment.kind,
          content: contentToAppend,
        },
      });
      // Re-throw the error so the limiter knows the job failed.
      throw e;
    }
  }

  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;

    // Clear any scheduled flushes
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Schedule a final "finalize" operation on the queue.
    // This will run after all pending `processToken` calls are done.
    // It will perform one last flush and mark the segment as complete.
    await this.limiter.schedule(() => this.finalizeCurrentSegment());

    // The 'empty' event handler will now trigger disconnection.
  }
}

export default BufferedTokenInsert;
