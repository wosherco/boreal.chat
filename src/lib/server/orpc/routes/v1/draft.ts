import { osBase } from "../../context";
import { z } from "zod";
import { MODELS, REASONING_LEVELS } from "$lib/common/ai/models";
import { db } from "$lib/server/db";
import { authenticatedMiddleware } from "../../middlewares";
import { draftsTable } from "$lib/server/db/schema";
import { eq, and } from "drizzle-orm";
import { ORPCError } from "@orpc/client";
import postgres from "postgres";

export const v1DraftRouter = osBase.router({
  upsert: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        id: z.string().uuid().optional(),
        content: z.string().min(1).max(10000),
        selectedModel: z.enum(MODELS),
        reasoningLevel: z.enum(REASONING_LEVELS).optional(),
        webSearchEnabled: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const query = db.insert(draftsTable).values({
        id: input.id,
        userId: context.userCtx.user.id,
        content: input.content,
        selectedModel: input.selectedModel,
        reasoningLevel: input.reasoningLevel || "none",
        webSearchEnabled: input.webSearchEnabled || false,
      });

      try {
        const [draft] = await (input.id
          ? query
              .onConflictDoUpdate({
                target: [draftsTable.id],
                set: {
                  content: input.content,
                  selectedModel: input.selectedModel,
                },
                where: and(
                  eq(draftsTable.id, input.id),
                  eq(draftsTable.userId, context.userCtx.user.id),
                ),
              })
              .returning()
              .execute()
          : query.returning().execute());

        if (!draft) {
          throw new ORPCError("NOT_FOUND", {
            message: "Draft not found",
          });
        }

        return draft;
      } catch (e) {
        if (e instanceof postgres.PostgresError) {
          throw new ORPCError("NOT_FOUND", {
            message: "Draft not found",
          });
        }

        throw e;
      }
    }),

  delete: osBase
    .use(authenticatedMiddleware)
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ context, input }) => {
      const [deletedDraft] = await db
        .delete(draftsTable)
        .where(and(eq(draftsTable.id, input.id), eq(draftsTable.userId, context.userCtx.user.id)))
        .returning();

      if (!deletedDraft) {
        throw new ORPCError("NOT_FOUND", {
          message: "Draft not found",
        });
      }

      return { success: true };
    }),

  deleteAll: osBase.use(authenticatedMiddleware).handler(async ({ context }) => {
    await db.delete(draftsTable).where(eq(draftsTable.userId, context.userCtx.user.id));

    return { success: true };
  }),
});
