import type { MessageSegmentKind } from "$lib/common";
import { db } from "$lib/server/db";
import { messageSegmentsTable } from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";

interface SegmentData {
  generationId: string;
  userId: string;
  messageId: string;
  kind: MessageSegmentKind;
  ordinal: number;
}

class DebouncedMessageUpdater {
  private segments: Map<string, SegmentData & { content: string; segmentId: string | null }> = new Map();
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_DELAY = 150; // 150ms debounce
  private isDestroyed = false;

  constructor() {}

  /**
   * Add or append token content to a segment
   */
  async addToken(
    generationId: string,
    userId: string,
    messageId: string,
    kind: MessageSegmentKind,
    ordinal: number,
    content: string
  ): Promise<void> {
    if (this.isDestroyed) {
      throw new Error("DebouncedMessageUpdater has been destroyed");
    }

    const segmentKey = `${generationId}-${kind}-${ordinal}`;
    const existingSegment = this.segments.get(segmentKey);

    if (existingSegment) {
      // Append to existing segment
      existingSegment.content += content;
    } else {
      // Create new segment
      this.segments.set(segmentKey, {
        generationId,
        userId,
        messageId,
        kind,
        ordinal,
        content,
        segmentId: null,
      });
    }

    // Reset debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      await this.flushUpdates();
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Immediately flush all pending updates
   */
  async flushImmediate(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    await this.flushUpdates();
  }

  private async flushUpdates(): Promise<void> {
    if (this.segments.size === 0) {
      return;
    }

    const segmentsToUpdate = Array.from(this.segments.values());

    for (const segment of segmentsToUpdate) {
      try {
        if (segment.segmentId) {
          // Update existing segment
          await db
            .update(messageSegmentsTable)
            .set({
              content: segment.content,
            })
            .where(eq(messageSegmentsTable.id, segment.segmentId));
        } else {
          // Create new segment
          const [newSegment] = await db
            .insert(messageSegmentsTable)
            .values({
              generationId: segment.generationId,
              userId: segment.userId,
              messageId: segment.messageId,
              ordinal: segment.ordinal,
              kind: segment.kind,
              content: segment.content,
            })
            .returning({ id: messageSegmentsTable.id });

          if (newSegment) {
            // Update our local reference
            const segmentKey = `${segment.generationId}-${segment.kind}-${segment.ordinal}`;
            const localSegment = this.segments.get(segmentKey);
            if (localSegment) {
              localSegment.segmentId = newSegment.id;
            }
          }
        }
      } catch (error) {
        console.error("Failed to update segment:", error);
        // Continue with other segments even if one fails
      }
    }
  }

  /**
   * Mark streaming as complete and ensure all updates are flushed
   */
  async finalize(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    await this.flushImmediate();
  }

  /**
   * Destroy the updater and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    await this.flushUpdates();
    this.segments.clear();
  }

  /**
   * Get current status for debugging
   */
  getStatus() {
    return {
      segmentCount: this.segments.size,
      isDestroyed: this.isDestroyed,
      hasPendingTimer: this.debounceTimer !== null,
    };
  }
}

export default DebouncedMessageUpdater;