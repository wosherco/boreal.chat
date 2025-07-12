import { db } from "$lib/server/db";
import { messageSegmentsTable } from "$lib/server/db/schema/chats";
import { eq, sql } from "drizzle-orm";
import PQueue from "p-queue";
import type { MessageSegmentKind } from "$lib/common";
import { useThrottle } from "runed";

const THROTTLE_MS = 100;

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

  private queue: PQueue;
  private buffer: string = "";
  private isDestroyed = false;

  private segmentOrdinal = 0;
  private currentSegment: CurrentSegment | null = null;
  private throttledUpdate: ReturnType<typeof useThrottle>;

  constructor(userId: string, messageId: string, initialOrdinal = 0) {
    this.userId = userId;
    this.messageId = messageId;
    this.queue = new PQueue({ concurrency: 1 });
    this.throttledUpdate = useThrottle(this.flush.bind(this), THROTTLE_MS);
    this.segmentOrdinal = initialOrdinal;
  }

  async insert(generationId: string, kind: MessageSegmentKind, content: string): Promise<void> {
    if (this.isDestroyed) {
      throw new Error("BufferedTokenInsert has been destroyed");
    }

    return this.queue.add(() => this.processToken({ generationId, kind, content }));
  }

  private async processToken(tokenData: TokenData): Promise<void> {
    const { generationId, kind, content } = tokenData;

    const isNewSegment =
      this.currentSegment === null ||
      this.currentSegment.kind !== kind ||
      this.currentSegment.generationId !== generationId;

    if (isNewSegment) {
      await this.finalizeAndCreateNewSegment(generationId, kind);
    }

    this.buffer += content;
    this.throttledUpdate();
  }

  private async finalizeCurrentSegment(): Promise<void> {
    if (!this.currentSegment) {
      return;
    }

    await this.flush();
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
        content: "",
      })
      .returning({ id: messageSegmentsTable.id });

    this.currentSegment = { id: newSegment.id, generationId, kind };
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0 || !this.currentSegment) {
      return;
    }

    const contentToAppend = this.buffer;
    this.buffer = "";

    await db
      .update(messageSegmentsTable)
      .set({
        content: sql`${messageSegmentsTable.content} || ${contentToAppend}`,
      })
      .where(eq(messageSegmentsTable.id, this.currentSegment.id));
  }

  /**
   * Makes sure that the current segment is finalized and the queue is empty, and destroys the instance.
   *
   * @returns
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;

    this.throttledUpdate.cancel();
    await this.queue.add(() => this.finalizeCurrentSegment());

    await this.queue.onIdle();
    this.queue.clear();
  }
}

export default BufferedTokenInsert;
