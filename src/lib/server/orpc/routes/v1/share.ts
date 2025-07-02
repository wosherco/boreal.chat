import { z } from "zod";
import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import {
  createMessageShare,
  createThreadShare,
  deleteMessageShare,
  deleteThreadShare,
  upsertChatShare,
} from "$lib/server/services/shares";
import { SHARE_PRIVACY_OPTIONS } from "$lib/common";

const messageInput = z.object({
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
  privacy: z.enum(SHARE_PRIVACY_OPTIONS).default("private"),
  emails: z.array(z.string().email()).optional(),
});

const threadInput = z.object({
  chatId: z.string().uuid(),
  threadId: z.string().uuid(),
  lastMessageId: z.string().uuid(),
  privacy: z.enum(SHARE_PRIVACY_OPTIONS).default("private"),
  emails: z.array(z.string().email()).optional(),
});

const chatInput = z.object({
  chatId: z.string().uuid(),
  privacy: z.enum(SHARE_PRIVACY_OPTIONS).default("private"),
  emails: z.array(z.string().email()).optional(),
});

export const v1ShareRouter = osBase.router({
  message: osBase.router({
    create: osBase
      .use(authenticatedMiddleware)
      .input(messageInput)
      .handler(async ({ context, input }) =>
        createMessageShare(context.userCtx.user.id, {
          chatId: input.chatId,
          messageId: input.messageId,
          privacy: input.privacy,
          emails: input.emails,
        }),
      ),
    update: osBase
      .use(authenticatedMiddleware)
      .input(messageInput.and(z.object({ shareId: z.string().length(21) })))
      .handler(async ({ context, input }) =>
        createMessageShare(context.userCtx.user.id, {
          chatId: input.chatId,
          existingShareId: input.shareId,
          messageId: input.messageId,
          privacy: input.privacy,
          emails: input.emails,
        }),
      ),
    delete: osBase
      .use(authenticatedMiddleware)
      .input(z.object({ shareId: z.string().length(21) }))
      .handler(async ({ context, input }) =>
        deleteMessageShare(context.userCtx.user.id, input.shareId),
      ),
  }),
  thread: osBase.router({
    create: osBase
      .use(authenticatedMiddleware)
      .input(threadInput)
      .handler(async ({ context, input }) =>
        createThreadShare(context.userCtx.user.id, {
          chatId: input.chatId,
          threadId: input.threadId,
          lastMessageId: input.lastMessageId,
          privacy: input.privacy,
          emails: input.emails,
        }),
      ),
    update: osBase
      .use(authenticatedMiddleware)
      .input(
        threadInput.and(
          z.object({
            shareId: z.string().length(21),
          }),
        ),
      )
      .handler(async ({ context, input }) =>
        createThreadShare(context.userCtx.user.id, {
          chatId: input.chatId,
          existingShareId: input.shareId,
          threadId: input.threadId,
          lastMessageId: input.lastMessageId,
          privacy: input.privacy,
          emails: input.emails,
        }),
      ),
    delete: osBase
      .use(authenticatedMiddleware)
      .input(z.object({ shareId: z.string().length(21) }))
      .handler(async ({ context, input }) =>
        deleteThreadShare(context.userCtx.user.id, input.shareId),
      ),
  }),
  chat: osBase.router({
    upsert: osBase
      .use(authenticatedMiddleware)
      .input(chatInput)
      .handler(async ({ context, input }) =>
        upsertChatShare(context.userCtx.user.id, {
          chatId: input.chatId,
          privacy: input.privacy,
          emails: input.emails,
        }),
      ),
  }),
});
