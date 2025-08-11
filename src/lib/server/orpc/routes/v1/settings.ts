import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import z from "zod";
import { db } from "$lib/server/db";
import { userTable } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import type { UserModelSettings } from "$lib/common/sharedTypes";
import { MODELS } from "$lib/common/ai/models";

export const ModelSettingsSchema = z.object({
  highlight: z.array(z.enum(MODELS)),
});

export type ModelSettingsInput = z.infer<typeof ModelSettingsSchema>;

export const v1SettingsRouter = osBase.router({
  updateModelSettings: osBase
    .use(authenticatedMiddleware)
    .input(ModelSettingsSchema)
    .handler(async ({ context, input }) => {
      const settings: UserModelSettings = {
        allmodels: Array.from(MODELS),
        highlight: Array.from(new Set(input.highlight)),
      };

      await db
        .update(userTable)
        .set({ modelSettings: settings })
        .where(eq(userTable.id, context.userCtx.user.id));

      return { success: true } as const;
    }),
});
