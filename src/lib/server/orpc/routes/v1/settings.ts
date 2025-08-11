import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import z from "zod";
import { db } from "$lib/server/db";
import { userTable } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { UserModelSettings } from "$lib/common/sharedTypes";

export const ModelSettingsSchema = z.object({
  allmodels: z.array(z.string()),
  highlight: z.array(z.string()),
});

export type ModelSettingsInput = z.infer<typeof ModelSettingsSchema>;

export const v1SettingsRouter = osBase.router({
  getModelSettings: osBase
    .use(authenticatedMiddleware)
    .handler(async ({ context }) => {
      const [user] = await db
        .select({ modelSettings: userTable.modelSettings })
        .from(userTable)
        .where(eq(userTable.id, context.userCtx.user.id));

      return user?.modelSettings ?? null;
    }),

  updateModelSettings: osBase
    .use(authenticatedMiddleware)
    .input(ModelSettingsSchema)
    .handler(async ({ context, input }) => {
      const settings: UserModelSettings = {
        allmodels: input.allmodels,
        highlight: input.highlight,
      };

      await db
        .update(userTable)
        .set({ modelSettings: settings })
        .where(eq(userTable.id, context.userCtx.user.id));

      return { success: true } as const;
    }),
});