import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import { 
  createCheckoutSession, 
  createCustomerSession,
  createPaymentMethod,
  getUserPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  createCreditPurchase,
  confirmCreditPurchase,
  getUserCredits,
  getUserCreditHistory
} from "$lib/server/stripe";
import { SUBSCRIPTION_PLANS, UNLIMITED_PLAN_NAME } from "$lib/common";
import z from "zod";

export const v1BillingRouter = osBase.router({
  // Existing subscription routes
  createCheckoutSession: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        plan: z.enum(SUBSCRIPTION_PLANS).optional().default(UNLIMITED_PLAN_NAME),
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

  // New credit-related routes
  addPaymentMethod: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        paymentMethodId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const paymentMethod = await createPaymentMethod(
          context.userCtx.user.id,
          input.paymentMethodId
        );

        return {
          success: true,
          paymentMethod,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to add payment method",
        };
      }
    }),

  getPaymentMethods: osBase
    .use(authenticatedMiddleware)
    .handler(async ({ context }) => {
      const paymentMethods = await getUserPaymentMethods(context.userCtx.user.id);
      return {
        success: true,
        paymentMethods,
      };
    }),

  setDefaultPaymentMethod: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        paymentMethodId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        await setDefaultPaymentMethod(context.userCtx.user.id, input.paymentMethodId);
        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to set default payment method",
        };
      }
    }),

  deletePaymentMethod: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        paymentMethodId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        await deletePaymentMethod(context.userCtx.user.id, input.paymentMethodId);
        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete payment method",
        };
      }
    }),

  createCreditPurchase: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        amount: z.number().min(5, "Minimum amount is $5"),
        paymentMethodId: z.string().optional(),
        isOneTime: z.boolean().default(true),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const result = await createCreditPurchase(
          context.userCtx.user.id,
          input.amount,
          input.paymentMethodId,
          input.isOneTime
        );

        if (!result) {
          return {
            success: false,
            error: "Failed to create credit purchase",
          };
        }

        return {
          success: true,
          clientSecret: result.clientSecret,
          transaction: result.transaction,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to create credit purchase",
        };
      }
    }),

  confirmCreditPurchase: osBase
    .use(authenticatedMiddleware)
    .input(
      z.object({
        paymentIntentId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      try {
        const paymentIntent = await confirmCreditPurchase(input.paymentIntentId);

        if (!paymentIntent) {
          return {
            success: false,
            error: "Failed to confirm credit purchase",
          };
        }

        return {
          success: true,
          status: paymentIntent.status,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to confirm credit purchase",
        };
      }
    }),

  getUserCredits: osBase
    .use(authenticatedMiddleware)
    .handler(async ({ context }) => {
      const credits = await getUserCredits(context.userCtx.user.id);
      return {
        success: true,
        credits: parseFloat(credits),
      };
    }),

  getCreditHistory: osBase
    .use(authenticatedMiddleware)
    .handler(async ({ context }) => {
      const history = await getUserCreditHistory(context.userCtx.user.id);
      return {
        success: true,
        history,
      };
    }),
});
