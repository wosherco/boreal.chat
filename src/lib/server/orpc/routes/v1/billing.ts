import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import { createCheckoutSession, createCustomerSession, createCreditCheckoutSession } from "$lib/server/stripe";
import { getCreditBalance, getCreditTransactions } from "$lib/server/services/credits";
import { CREDIT_PACKAGES } from "$lib/server/stripe/constants";
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

  // Credit system routes
  getCreditBalance: osBase
    .use(authenticatedMiddleware)
    .handler(async ({ context }) => {
      const balance = await getCreditBalance(context.userCtx.user.id);
      
      return {
        success: true,
        balance,
      };
    }),

  getCreditTransactions: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }),
    )
    .handler(async ({ context, input }) => {
      const transactions = await getCreditTransactions(
        context.userCtx.user.id,
        input.limit,
        input.offset
      );
      
      return {
        success: true,
        transactions,
      };
    }),

  getCreditPackages: osBase
    .use(authenticatedMiddleware)
    .handler(async () => {
      return {
        success: true,
        packages: CREDIT_PACKAGES,
      };
    }),

  createCreditCheckoutSession: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        packageId: z.string(),
        couponCode: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const session = await createCreditCheckoutSession(
        context.userCtx.user.id,
        input.packageId,
        input.couponCode
      );

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
