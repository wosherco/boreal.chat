import { osBase } from "../../context";
import { z } from "zod";
import { MODELS, REASONING_LEVELS } from "$lib/common/ai/models";
import { db } from "$lib/server/db";
import { authenticatedMiddleware } from "../../middlewares";
import { draftsTable } from "$lib/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ORPCError } from "@orpc/client";

export const v1DraftRouter = osBase.router({
  create: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        content: z.string().min(1).max(10000),
        selectedModel: z.enum(MODELS),
        reasoningLevel: z.enum(REASONING_LEVELS).optional(),
        webSearchEnabled: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [draft] = await db
        .insert(draftsTable)
        .values({
          userId: context.userCtx.user.id,
          content: input.content,
          selectedModel: input.selectedModel,
          reasoningLevel: input.reasoningLevel || "none",
          webSearchEnabled: input.webSearchEnabled || false,
        })
        .returning();

      return draft;
    }),

  update: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string().min(1).max(10000),
        selectedModel: z.enum(MODELS).optional(),
        reasoningLevel: z.enum(REASONING_LEVELS).optional(),
        webSearchEnabled: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const updateData: any = {
        content: input.content,
        updatedAt: new Date(),
      };

      if (input.selectedModel !== undefined) {
        updateData.selectedModel = input.selectedModel;
      }
      if (input.reasoningLevel !== undefined) {
        updateData.reasoningLevel = input.reasoningLevel;
      }
      if (input.webSearchEnabled !== undefined) {
        updateData.webSearchEnabled = input.webSearchEnabled;
      }

      const [draft] = await db
        .update(draftsTable)
        .set(updateData)
        .where(
          and(
            eq(draftsTable.id, input.id),
            eq(draftsTable.userId, context.userCtx.user.id),
          ),
        )
        .returning();

      if (!draft) {
        throw new ORPCError("NOT_FOUND", {
          message: "Draft not found",
        });
      }

      return draft;
    }),

  list: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      }),
    )
    .handler(async ({ context, input }) => {
      const drafts = await db
        .select()
        .from(draftsTable)
        .where(eq(draftsTable.userId, context.userCtx.user.id))
        .orderBy(desc(draftsTable.updatedAt))
        .limit(input.limit)
        .offset(input.offset);

      return drafts;
    }),

  get: osBase
    .use(authenticatedMiddleware)
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ context, input }) => {
      const [draft] = await db
        .select()
        .from(draftsTable)
        .where(
          and(
            eq(draftsTable.id, input.id),
            eq(draftsTable.userId, context.userCtx.user.id),
          ),
        );

      if (!draft) {
        throw new ORPCError("NOT_FOUND", {
          message: "Draft not found",
        });
      }

      return draft;
    }),

  delete: osBase
    .use(authenticatedMiddleware)
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ context, input }) => {
      const [deletedDraft] = await db
        .delete(draftsTable)
        .where(
          and(
            eq(draftsTable.id, input.id),
            eq(draftsTable.userId, context.userCtx.user.id),
          ),
        )
        .returning();

      if (!deletedDraft) {
        throw new ORPCError("NOT_FOUND", {
          message: "Draft not found",
        });
      }

      return { success: true };
    }),

  deleteAll: osBase
    .use(authenticatedMiddleware)
    .handler(async ({ context }) => {
      await db
        .delete(draftsTable)
        .where(eq(draftsTable.userId, context.userCtx.user.id));

      return { success: true };
    }),
});