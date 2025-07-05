import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import { createCheckoutSession, createCustomerSession } from "$lib/server/stripe";

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

  createCustomerSession: osBase.use(authenticatedMiddleware).handler(async ({ context }) => {
    const session = await createCustomerSession(context.userCtx.user.id);

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
