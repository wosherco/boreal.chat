import { db } from "../db";
import { osBase } from "./context";
import { chatTable, openRouterKeyTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/client";
import { isSubscribed } from "$lib/common/utils/subscription";
import type { transcribeRatelimiter } from "../ratelimit";

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

export const proMiddleware = authenticatedMiddleware.concat(async ({ context, next }) => {
  if (!isSubscribed(context.userCtx.user)) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "You need to be subscribed to use this feature.",
    });
  }

  return next();
});

export const openRouterMiddleware = authenticatedMiddleware.concat(async ({ context, next }) => {
  const [openRouterKey] = await db
    .select()
    .from(openRouterKeyTable)
    .where(eq(openRouterKeyTable.userId, context.userCtx.user.id))
    .limit(1);

  if (!openRouterKey) {
    throw new ORPCError("UNAUTHORIZED", {
      message:
        "OpenRouter key not found. Please, go to settings, and connect your OpenRouter account in the BYOK tab.",
    });
  }

  return next({
    context: {
      ...context,
      userCtx: {
        user: context.userCtx.user,
        session: context.userCtx.session,
      },
      openRouterKey,
    },
  });
});

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
    const result = await ratelimit.limit(context.userCtx.user.id);

    if (!result.success) {
      context.headers.set("X-RateLimit-Limit", result.limit.toString());
      context.headers.set("X-RateLimit-Remaining", result.remaining.toString());
      context.headers.set("X-RateLimit-Reset", result.reset.toString());

      throw new ORPCError("RATE_LIMIT_EXCEEDED", {
        message: "You have reached the rate limit. Please, try again later.",
      });
    }

    return next();
  });
