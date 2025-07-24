import { db } from "../db";
import { osBase } from "./context";
import { chatTable, openRouterKeyTable, anonymousVerificationTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/client";
import { isSubscribed, hasUnlimitedAccess, hasFreePlanAccess } from "$lib/common/utils/subscription";
import { burstCULimiter, getRatelimitConsumeHeaders, localCULimiter, anonymousCULimiter, freeCULimiter } from "../ratelimit";
import type { ModelId } from "$lib/common/ai/models";
import { BILLING_ENABLED } from "$lib/common/constants";
import { env } from "$env/dynamic/private";
import { approximateTokens, calculateCUs, type CUResult } from "../ratelimit/cu";
import type { TokenBucketRateLimiter } from "pv-ratelimit";
import { z } from "zod/v4";
import { dev } from "$app/environment";
import { getClientIp } from "../utils/ip";
import { FREE_PLAN_NAME } from "$lib/common";

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

export const anonymousOrAuthenticatedMiddleware = osBase.middleware(async ({ context, next }) => {
  // Allow both authenticated users and verified anonymous users
  if (context.userCtx.user && context.userCtx.session) {
    // Authenticated user
    return next({
      context: {
        ...context,
        userCtx: {
          user: context.userCtx.user,
          session: context.userCtx.session,
        },
        isAnonymous: false,
      },
    });
  }

  // For anonymous users, we'll validate during the verification middleware
  return next({
    context: {
      ...context,
      isAnonymous: true,
    },
  });
});

export const verifiedAnonymousMiddleware = ipMiddleware.concat(async ({ context, next }) => {
  // If user is authenticated, skip verification
  if (context.userCtx?.user && context.userCtx?.session) {
    return next();
  }

  // Get session ID from request (you might need to adjust based on your session handling)
  const sessionId = context.headers.get('x-session-id') || 'anonymous-' + context.clientIp;
  
  // Check if anonymous user has been verified in the last 10 minutes
  const [verification] = await db
    .select()
    .from(anonymousVerificationTable)
    .where(
      and(
        eq(anonymousVerificationTable.sessionId, sessionId),
        eq(anonymousVerificationTable.clientIp, context.clientIp)
      )
    )
    .limit(1);

  const now = new Date();
  const isVerified = verification && verification.expiresAt > now;

  if (!isVerified) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Anonymous user verification required",
      data: { 
        requiresVerification: true,
        requiresInvisibleCaptcha: true 
      },
    });
  }

  return next();
});

export const anonymousInferenceMiddleware = verifiedAnonymousMiddleware.concat(inferenceMiddleware);

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

export const inferenceMiddleware = anonymousOrAuthenticatedMiddleware.concat(
  async ({ context, next }, input: { model: ModelId; message?: string }) => {
    // Handle authenticated users
    if (context.userCtx?.user && context.userCtx?.session) {
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

      // Check if user has unlimited access
      if (hasUnlimitedAccess(context.userCtx.user)) {
        // Unlimited plan - use existing unlimited rate limiters
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
      }

      // Free plan user - use limited rate limiter
      const estimatedCUs = calculateCUs(
        input.message ? approximateTokens(input.message) : 500,
        5000,
        input.model,
      );

      const freeResult = await freeCULimiter.consume(context.userCtx.user.id, estimatedCUs.total);

      if (!freeResult.success) {
        context.setHeaders?.(
          getRatelimitConsumeHeaders(freeResult.remainingTokens, freeResult.nextRefillAt),
        );

        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: "You have reached the free plan rate limit. Please upgrade to unlimited plan or try again later.",
        });
      }

      return next({
        context: {
          inferenceContext: {
            publicUsage: false,
            key: env.OPENROUTER_API_KEY,
            estimatedCUs,
            ratelimit: "free",
          },
        },
      });
    }

    // Handle anonymous users - requires verification and very limited rate limiting
    if (!env.OPENROUTER_API_KEY) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Anonymous usage requires OpenRouter API key to be configured.",
      });
    }

    const estimatedCUs = calculateCUs(
      input.message ? approximateTokens(input.message) : 500,
      5000,
      input.model,
    );

    // Use IP address as identifier for anonymous users
    const clientIp = context.headers.get('x-forwarded-for')?.split(',')[0] || 
                     context.headers.get('x-real-ip') || 
                     'unknown';
    
    const anonymousResult = await anonymousCULimiter.consume(clientIp, estimatedCUs.total);

    if (!anonymousResult.success) {
      context.setHeaders?.(
        getRatelimitConsumeHeaders(anonymousResult.remainingTokens, anonymousResult.nextRefillAt),
      );

      throw new ORPCError("RATE_LIMIT_EXCEEDED", {
        message: "You have reached the anonymous usage rate limit. Please register for higher limits.",
      });
    }

    return next({
      context: {
        inferenceContext: {
          publicUsage: false,
          key: env.OPENROUTER_API_KEY,
          estimatedCUs,
          ratelimit: "anonymous",
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
        deletedAt: chatTable.deletedAt,
        archived: chatTable.archived,
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

export const activeChatMiddleware = chatOwnerMiddleware.concat(async ({ context, next }) => {
  if (context.chat.deletedAt) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Chat is deleted",
    });
  }

  if (context.chat.archived) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Chat is archived",
    });
  }

  return next();
});

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
  const clientIp = getClientIp(context.headers);

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

const TURNSTILE_SECRET_KEY = dev ? "1x0000000000000000000000000000000AA" : env.TURNSTILE_SECRET_KEY;

export const turnstileMiddleware = ipMiddleware.concat(
  async ({ context, next }, input: { turnstileToken?: string }) => {
    if (TURNSTILE_SECRET_KEY && !input.turnstileToken) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Turnstile token is required",
      });
    }

    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const result = await fetch(url, {
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
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
