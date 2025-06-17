import { db } from "$lib/server/db";
import { openRouterKeyTable } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import { ORPCError } from "@orpc/client";

export const v1ByokRouter = osBase.router({
  delete: osBase.use(authenticatedMiddleware).handler(async ({ context }) => {
    const [openrouterAccount] = await db
      .delete(openRouterKeyTable)
      .where(eq(openRouterKeyTable.userId, context.userCtx.user.id))
      .returning({
        id: openRouterKeyTable.id,
      });

    if (!openrouterAccount) {
      throw new ORPCError("NOT_FOUND", {
        message: "No OpenRouter account found",
      });
    }

    return {
      success: true,
    };
  }),
});
