import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import { createCheckoutSession, createCustomerSession } from "$lib/server/stripe";
import z from "zod";

export const v1BillingRouter = osBase.router({
  createCheckoutSession: osBase.use(authenticatedMiddleware).handler(async ({ context }) => {
    const session = await createCheckoutSession(context.userCtx.user.id);

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
