import { db } from "$lib/server/db";
import { byokTable } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { BYOK_PLATFORMS } from "$lib/common";

export const v1ByokRouter = osBase.router({
  delete: osBase
    .use(authenticatedMiddleware)
    .input(z.object({ platform: z.enum(BYOK_PLATFORMS) }))
    .handler(async ({ context, input }) => {
      const [byokAccount] = await db
        .delete(byokTable)
        .where(
          and(
            eq(byokTable.userId, context.userCtx.user.id),
            eq(byokTable.platform, input.platform),
          ),
        )
        .returning({
          id: byokTable.id,
        });

      if (!byokAccount) {
        throw new ORPCError("NOT_FOUND", {
          message: "No BYOK account found",
        });
      }

      return {
        success: true,
      };
    }),
});
