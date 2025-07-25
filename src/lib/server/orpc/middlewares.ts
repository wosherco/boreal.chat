import { db } from "../db";
import { osBase } from "./context";
import { chatTable, openRouterKeyTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/client";
import { isSubscribed } from "$lib/common/utils/subscription";
import {
  anonymousCULimiter,
  burstCULimiter,
  freeCULimiter,
  getRatelimitConsumeHeaders,
  ipCULimiter,
  localCULimiter,
} from "../ratelimit";
import { FREE_MODELS, type ModelId } from "$lib/common/ai/models";
import { ANONYMOUS_ALLOWED, BILLING_ENABLED } from "$lib/common/constants";
import { env } from "$env/dynamic/private";
import { approximateTokens, calculateCUs, type CUResult } from "../ratelimit/cu";
import type { TokenBucketRateLimiter } from "pv-ratelimit";
import { getClientIp } from "../utils/ip";
import { verifyTurnstileToken } from "../utils/turnstile";
import { TURNSTILE_SECRET_KEY } from "$env/static/private";
import { isAnonymousSessionVerified } from "../services/auth/anonymous";
import { isAnonymousUser } from "$lib/common/utils/anonymous";

/**
 * Middleware that checks if the request contains a client IP.
 */
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

/**
 * Middleware that checks if the request contains a session.
 */
export const sessionMiddleware = osBase.middleware(({ context, next }) => {
  if (!context.userCtx.user || !context.userCtx.session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Unauthorized",
    });
  }

  return next({
    context: {
      userCtx: {
        user: context.userCtx.user,
        session: context.userCtx.session,
      },
    },
  });
});

/**
 * Middleware that checks if the request contains a session, and that the session is verified.
 */
export const verifiedSessionMiddleware = ipMiddleware
  .concat(sessionMiddleware)
  .concat(({ context, next, errors }) => {
    if (
      isAnonymousUser(context.userCtx.user) &&
      !isAnonymousSessionVerified(context.userCtx.session, context.clientIp)
    ) {
      throw errors.SESSION_NOT_VERIFIED();
    }

    return next();
  });

/**
 * Middleware that checks if the request contains a user and a session, and that the user is anonymous.
 */
export const anonymousUserMiddleware = sessionMiddleware.concat(({ context, next }) => {
  if (!isAnonymousUser(context.userCtx.user)) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Unauthorized",
    });
  }

  return next();
});

/**
 * Middleware that checks if the request contains a user and a session, and that the user is not anonymous.
 */
export const authenticatedMiddleware = sessionMiddleware.concat(({ context, next }) => {
  if (isAnonymousUser(context.userCtx.user)) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Unauthorized",
    });
  }

  return next();
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

export const inferenceMiddleware = verifiedSessionMiddleware.concat(
  async ({ context, next }, input: { model: ModelId; message?: string }) => {
    const anonymous = isAnonymousUser(context.userCtx.user);

    if (anonymous && !ANONYMOUS_ALLOWED) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Please, sign up to use boreal.chat",
      });
    }

    const [openRouterKey] = await db
      .select()
      .from(openRouterKeyTable)
      .where(eq(openRouterKeyTable.userId, context.userCtx.user.id))
      .limit(1);

    // TODO: Add check if the user wants to really use the openrouter key
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

    const subscribed = isSubscribed(context.userCtx.user);

    if ((!subscribed || anonymous) && (!ANONYMOUS_ALLOWED || !FREE_MODELS.includes(input.model))) {
      throw new ORPCError("UNAUTHORIZED", {
        message:
          "You need to be subscribed to use this feature, or bring your own OpenRouter key (in settings).",
      });
    }

    // We process the rate limits
    const estimatedCUs = calculateCUs(
      input.message ? approximateTokens(input.message) : 500,
      5000,
      input.model,
    );

    let ratelimiters: TokenBucketRateLimiter[] = [];

    if (anonymous || !subscribed) {
      ratelimiters = [ipCULimiter];
      const ipResult = await ipCULimiter.consume(context.clientIp, estimatedCUs.total);

      if (!ipResult.success) {
        context.setHeaders?.(
          getRatelimitConsumeHeaders(ipResult.remainingTokens, ipResult.nextRefillAt),
        );

        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: `You've sent too many messages. ${anonymous ? "Please, sign up to continue using boreal.chat" : "Please, subscribe to continue using boreal.chat, or wait up to 1 hour."}`,
        });
      }

      const localRatelimiter = anonymous ? anonymousCULimiter : freeCULimiter;
      ratelimiters.push(localRatelimiter);
      const localResult = await localRatelimiter.consume(
        context.userCtx.user.id,
        estimatedCUs.total,
      );

      if (!localResult.success) {
        context.setHeaders?.(
          getRatelimitConsumeHeaders(localResult.remainingTokens, localResult.nextRefillAt),
        );
        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: `You've sent too many messages. ${anonymous ? "Please, sign up to continue using boreal.chat" : "Please, subscribe to continue using boreal.chat, or wait up to 1 hour."}`,
        });
      }
    } else {
      ratelimiters = [localCULimiter];
      const localResult = await localCULimiter.consume(context.userCtx.user.id, estimatedCUs.total);

      if (!localResult.success) {
        ratelimiters = [burstCULimiter];
        const burstResult = await burstCULimiter.consume(
          context.userCtx.user.id,
          estimatedCUs.total,
        );

        if (!burstResult.success) {
          context.setHeaders?.(
            getRatelimitConsumeHeaders(burstResult.remainingTokens, burstResult.nextRefillAt),
          );

          throw new ORPCError("RATE_LIMIT_EXCEEDED", {
            message: "You have reached the rate limit. Please, try again later.",
          });
        }
      }
    }

    return next({
      context: {
        inferenceContext: {
          publicUsage: false,
          key: env.OPENROUTER_API_KEY,
          estimatedCUs,
          ratelimiters,
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

export const turnstileMiddleware = ipMiddleware.concat(
  async ({ context, next }, input: { turnstileToken?: string }) => {
    if (TURNSTILE_SECRET_KEY) {
      if (!input.turnstileToken) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Turnstile token is required",
        });
      }

      const verified = await verifyTurnstileToken(input.turnstileToken, context.clientIp);

      if (!verified) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Invalid turnstile token",
        });
      }
    }

    return next();
  },
);
