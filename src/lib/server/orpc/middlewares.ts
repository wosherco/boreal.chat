import { db } from "../db";
import { osBase } from "./context";
import { chatTable, openRouterKeyTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/client";
import { isSubscribed } from "$lib/common/utils/subscription";
import {
  burstCULimiter,
  getRatelimitConsumeHeaders,
  localCULimiter,
  type transcribeRatelimiter,
} from "../ratelimit";
import type { ModelId } from "$lib/common/ai/models";
import { BILLING_ENABLED } from "$lib/common/constants";
import { env } from "$env/dynamic/private";
import { approximateTokens, calculateCUs, type CUResult } from "../ratelimit/cu";

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

export const creditsMiddleware = authenticatedMiddleware.concat(async ({ context, next }) => {
  if (!isSubscribed(context.userCtx.user)) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You need to have credits to use this feature.",
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
          "You need to have credits to use this feature, or bring your own OpenRouter key (in settings).",
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
        context.setHeaders?.(getRatelimitConsumeHeaders(burstCULimiter, burstResult));

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

export const ratelimitMiddleware = (ratelimit: typeof transcribeRatelimiter) =>
  authenticatedMiddleware.concat(async ({ context, next }) => {
    const result = await ratelimit.consume(context.userCtx.user.id);

    if (!result.success) {
      context.setHeaders?.(getRatelimitConsumeHeaders(ratelimit, result));

      throw new ORPCError("RATE_LIMIT_EXCEEDED", {
        message: "You have reached the rate limit. Please, try again later.",
      });
    }

    return next();
  });
