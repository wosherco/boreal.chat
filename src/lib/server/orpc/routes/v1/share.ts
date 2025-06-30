import { z } from "zod";
import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import {
  createMessageShare,
  createThreadShare,
  createChatShare,
} from "$lib/server/services/shares";
import { SHARE_PRIVACY_OPTIONS } from "$lib/common";

const messageInput = z.object({
  messageId: z.string().uuid(),
  privacy: z.enum(SHARE_PRIVACY_OPTIONS).default("public"),
  emails: z.array(z.string().email()).optional(),
});

const threadInput = z.object({
  threadId: z.string().uuid(),
  lastMessageId: z.string().uuid(),
  privacy: z.enum(SHARE_PRIVACY_OPTIONS).default("public"),
  emails: z.array(z.string().email()).optional(),
});

const chatInput = z.object({
  chatId: z.string().uuid(),
  privacy: z.enum(SHARE_PRIVACY_OPTIONS).default("public"),
  emails: z.array(z.string().email()).optional(),
});

export const v1ShareRouter = osBase.router({
  message: osBase.router({
    create: osBase
      .use(authenticatedMiddleware)
      .input(messageInput)
      .handler(async ({ context, input }) =>
        createMessageShare(
          context.userCtx.user.id,
          input.messageId,
          input.privacy,
          input.emails ?? [],
        ),
      ),
  }),
  thread: osBase.router({
    create: osBase
      .use(authenticatedMiddleware)
      .input(threadInput)
      .handler(async ({ context, input }) =>
        createThreadShare(
          context.userCtx.user.id,
          input.threadId,
          input.lastMessageId,
          input.privacy,
          input.emails ?? [],
        ),
      ),
  }),
  chat: osBase.router({
    create: osBase
      .use(authenticatedMiddleware)
      .input(chatInput)
      .handler(async ({ context, input }) =>
        createChatShare(context.userCtx.user.id, input.chatId, input.privacy, input.emails ?? []),
      ),
  }),
});
