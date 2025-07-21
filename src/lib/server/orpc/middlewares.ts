import { db } from "../db";
import { osBase } from "./context";
import { chatTable, openRouterKeyTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/client";
import { isSubscribed } from "$lib/common/utils/subscription";
import { burstCULimiter, getRatelimitConsumeHeaders, localCULimiter } from "../ratelimit";
import type { ModelId } from "$lib/common/ai/models";
import { BILLING_ENABLED } from "$lib/common/constants";
import { env } from "$env/dynamic/private";
import { approximateTokens, calculateCUs, type CUResult } from "../ratelimit/cu";
import type { TokenBucketRateLimiter } from "pv-ratelimit";
import { z } from "zod/v4";

export const authenticatedMiddleware = osBase.middleware(async ({ context, next }) => {
  if (!context.userCtx.user || !context.userCtx.session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Unauthorized",
    });
  }

  return next({
    context: {
      ...context,
      userCtx: {
        user: context.userCtx.user,
        session: context.userCtx.session,
      },
    },
  });
});

export const subscribedMiddleware = authenticatedMiddleware.concat(async ({ context, next }) => {
  if (!isSubscribed(context.userCtx.user)) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You need to be subscribed to Unlimited plan to use this feature.",
    });
  }

  return next();
});

export interface ModelExecutionContext {
  publicUsage: boolean;
  key: string;
  estimatedCUs?: CUResult;
}

export const inferenceMiddleware = authenticatedMiddleware.concat(
  async ({ context, next }, input: { model: ModelId; message?: string }) => {
    const [openRouterKey] = await db
      .select()
      .from(openRouterKeyTable)
      .where(eq(openRouterKeyTable.userId, context.userCtx.user.id))
      .limit(1);

    if (openRouterKey) {
      return next({
        context: {
          inferenceContext: {
            publicUsage: true,
            key: openRouterKey.apiKey,
          },
        },
      });
    }

    if (!env.OPENROUTER_API_KEY) {
      throw new ORPCError("UNAUTHORIZED", {
        message:
          "OpenRouter key not found. Please, go to settings, and connect your OpenRouter account in the BYOK tab.",
      });
    }

    if (!BILLING_ENABLED) {
      // We're on self-hosted, so everything is public
      return next({
        context: {
          inferenceContext: {
            publicUsage: true,
            key: env.OPENROUTER_API_KEY,
          },
        },
      });
    }

    if (!isSubscribed(context.userCtx.user)) {
      throw new ORPCError("UNAUTHORIZED", {
        message:
          "You need to be subscribed to atleast Premium plan to use this feature, or bring your own OpenRouter key (in settings).",
      });
    }

    // We process the rate limits
    const estimatedCUs = calculateCUs(
      input.message ? approximateTokens(input.message) : 500,
      5000,
      input.model,
    );

    let ratelimit: "local" | "burst" = "local";
    const localResult = await localCULimiter.consume(context.userCtx.user.id, estimatedCUs.total);

    if (!localResult.success) {
      ratelimit = "burst";
      const burstResult = await burstCULimiter.consume(context.userCtx.user.id, estimatedCUs.total);

      if (!burstResult.success) {
        context.setHeaders?.(
          getRatelimitConsumeHeaders(burstResult.remainingTokens, burstResult.nextRefillAt),
        );

        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: "You have reached the rate limit. Please, try again later.",
        });
      }
    }

    return next({
      context: {
        inferenceContext: {
          publicUsage: false,
          key: env.OPENROUTER_API_KEY,
          estimatedCUs,
          ratelimit,
        },
      },
    });
  },
);

export const chatOwnerMiddleware = authenticatedMiddleware.concat(
  async ({ context, next }, input: { chatId: string }) => {
    const [chat] = await db
      .select({
        id: chatTable.id,
        createdAt: chatTable.createdAt,
        updatedAt: chatTable.updatedAt,
        model: chatTable.selectedModel,
        reasoningLevel: chatTable.reasoningLevel,
        webSearchEnabled: chatTable.webSearchEnabled,
      })
      .from(chatTable)
      .where(and(eq(chatTable.id, input.chatId), eq(chatTable.userId, context.userCtx.user.id)))
      .limit(1);

    if (!chat) {
      throw new ORPCError("NOT_FOUND", {
        message: "Chat not found",
      });
    }

    return next({
      context: {
        chat,
      },
    });
  },
);

export const tokenBucketRatelimitMiddleware = (ratelimit: TokenBucketRateLimiter) =>
  authenticatedMiddleware.concat(async ({ context, next }) => {
    const result = await ratelimit.consume(context.userCtx.user.id);

    if (!result.success) {
      context.setHeaders?.(getRatelimitConsumeHeaders(result.remainingTokens, result.nextRefillAt));

      throw new ORPCError("RATE_LIMIT_EXCEEDED", {
        message: "You have reached the rate limit. Please, try again later.",
      });
    }

    return next();
  });

export const ipMiddleware = osBase.middleware(({ context, next }) => {
  const clientIp = context.headers.get("x-forwarded-for")?.split(",")[0];

  if (!clientIp) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Client IP not found",
    });
  }

  return next({
    context: {
      ...context,
      clientIp,
    },
  });
});

const basicTurnstileSchema = z.object({
  success: z.boolean(),
});

export const turnstileMiddleware = ipMiddleware.concat(
  async ({ context, next }, input: { turnstileToken?: string }) => {
    if (env.TURNSTILE_SECRET_KEY && !input.turnstileToken) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Turnstile token is required",
      });
    }

    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const result = await fetch(url, {
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: input.turnstileToken,
        remoteip: context.clientIp,
      }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await basicTurnstileSchema.safeParseAsync(await result.json());

    if (!data.success) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invalid turnstile token",
      });
    }

    if (!data.data.success) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invalid turnstile token",
      });
    }

    return next();
  },
);
