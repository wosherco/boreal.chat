import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import { createCheckoutSession, createCustomerSession } from "$lib/server/stripe";
import { SUBSCRIPTION_PLANS } from "$lib/common";
import z from "zod";

export const v1BillingRouter = osBase.router({
  createCheckoutSession: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        plan: z.enum(SUBSCRIPTION_PLANS).optional().default("premium"),
      }),
    )
    .handler(async ({ context, input }) => {
      const session = await createCheckoutSession(context.userCtx.user.id, input.plan);

      if (!session) {
        return {
          success: false,
        };
      }

      return {
        success: true,
        url: session.url,
      };
    }),

  createCustomerSession: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        toCancel: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const session = await createCustomerSession(context.userCtx.user.id, input.toCancel);

      if (!session) {
        return {
          success: false,
        };
      }

      return {
        success: true,
        url: session.url,
      };
    }),
});
