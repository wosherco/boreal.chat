import { osBase } from "../../context";
import { z } from "zod";
import { GPT_4_1_NANO, LLAMA_3_3_70B_FREE, MODELS, REASONING_LEVELS } from "$lib/common/ai/models";
import { db } from "$lib/server/db";
import {
  activeChatMiddleware,
  chatOwnerMiddleware,
  inferenceMiddleware,
  sessionMiddleware,
  verifiedSessionMiddleware,
} from "../../middlewares";
import {
  createChat,
  createReplyUserMessageAndAssistantMessage,
  createUserMessageAndStartAssistantMessage,
  fetchThreadMessagesRecursive,
  findAndUpdateChat,
  markMessageAsErrored,
  regenerateMessage,
} from "$lib/server/services/messages";
import { initializeChatContext } from "$lib/server/ai/state";
import { generateChatTitle, type GenerateChatTitleContext } from "$lib/server/ai/agents/title";
import { and, eq } from "drizzle-orm";
import { chatTable, messageTable, draftsTable } from "$lib/server/db/schema";
import { ORPCError } from "@orpc/client";
import * as Sentry from "@sentry/sveltekit";
import { posthog } from "$lib/server/posthog";
import { executeAgentSafely, type ModelExecutionParams } from "$lib/server/services/agent";
import { sendCancelMessage } from "$lib/server/db/mq/messageCancellation";
import {
  deleteChat,
  renameChat,
  archiveChat,
  unarchiveChat,
  restoreChat,
  permanentlyDeleteChat,
} from "$lib/server/services/chat";
import { chatTitleSchema } from "$lib/common/validators/chat";
import type { CUResult } from "$lib/server/ratelimit/cu";

export const v1ChatRouter = osBase.router({
  newChat: osBase
    .use(verifiedSessionMiddleware)
    .input(
      z.object({
        model: z.enum(MODELS),
        message: z.string().min(1).max(10000),
        webSearchEnabled: z.boolean().optional(),
        reasoningLevel: z.enum(REASONING_LEVELS).optional(),
        draftId: z.string().uuid().optional(),
        byokId: z.string().uuid().optional(),
      }),
    )
    .use(inferenceMiddleware)
    .handler(async ({ context, input }) => {
      const defaultThinkingLevel = input.reasoningLevel ?? "none";

      const result = await db.transaction(async (tx) => {
        const { chatId, threadId } = await createChat(tx, context.userCtx.user.id, {
          model: input.model,
          webSearchEnabled: input.webSearchEnabled ?? false,
          reasoningLevel: input.reasoningLevel ?? "none",
        });

        const { userMessage, assistantMessageId } = await createUserMessageAndStartAssistantMessage(
          tx,
          {
            userId: context.userCtx.user.id,
            chatId,
            threadId,
            message: input.message,
            model: input.model,
          },
        );

        // Delete draft if provided
        if (input.draftId) {
          await tx
            .delete(draftsTable)
            .where(
              and(
                eq(draftsTable.id, input.draftId),
                eq(draftsTable.userId, context.userCtx.user.id),
              ),
            );
        }

        return {
          chatId,
          threadId,
          userMessage,
          assistantMessageId,
        };
      });

      posthog?.capture({
        distinctId: context.userCtx.user.id,
        event: "v1_new_chat",
        properties: {
          model: input.model,
          webSearchEnabled: input.webSearchEnabled ?? false,
          reasoningLevel: input.reasoningLevel ?? "none",
          chatId: result.chatId,
          threadId: result.threadId,
          userMessageId: result.userMessage.id,
          assistantMessageId: result.assistantMessageId,
        },
      });

      // Invoking the title agent
      try {
        const titlePromise = generateChatTitle(
          {
            userId: context.userCtx.user.id,
            chatId: result.chatId,
            threadId: result.threadId,
            userMessageId: result.userMessage.id,
          } satisfies GenerateChatTitleContext,
          input.message,
          context.inferenceContext.key,
          input.model.endsWith(":free") ? LLAMA_3_3_70B_FREE : GPT_4_1_NANO,
        )
          .then((title) => {
            if (title) {
              return db
                .update(chatTable)
                .set({ title: title })
                .where(eq(chatTable.id, result.chatId))
                .execute();
            }
          })
          .catch((error) => {
            Sentry.captureException(error, {
              user: { id: context.userCtx.user.id },
              extra: {
                chatId: result.chatId,
                threadId: result.threadId,
                userMessageId: result.userMessage.id,
              },
            });
            console.error("Error generating chat title: ", error);
          });

        if (context.ctx?.waitUntil) {
          context.ctx.waitUntil(titlePromise);
        } else {
          void titlePromise;
        }
      } catch (e) {
        Sentry.captureException(e, {
          user: { id: context.userCtx.user.id },
          extra: {
            chatId: result.chatId,
            threadId: result.threadId,
            userMessageId: result.userMessage.id,
          },
        });
        console.error("Error generating chat title: ", e);
      }

      try {
        // Initialize the context properly
        const chatContext = await initializeChatContext({
          userId: context.userCtx.user.id,
          userAlias: context.userCtx.user.name,
          chatId: result.chatId,
          threadId: result.threadId,
          currentMessageId: result.assistantMessageId,
          modelId: input.model,
          messages: [
            {
              ...result.userMessage,
              segments: [
                {
                  kind: "text",
                  content: input.message,
                  ordinal: 1,
                  toolCallId: null,
                  toolName: null,
                  toolArgs: null,
                  toolResult: null,
                  streaming: false,
                },
              ],
            },
          ],
        });

        // Invoke the agent with the initialized context
        const agentPromise = executeAgentSafely(
          {
            model: input.model,
            reasoningLevel: defaultThinkingLevel,
            webSearchEnabled: input.webSearchEnabled ?? false,
            openRouterKey: context.inferenceContext.key,
            publicUsage: context.inferenceContext.publicUsage,
            // TODO: IDK why the middleware is not picking the types correctly. Maybe updating orpc fixes this.
            estimatedCUs:
              "estimatedCUs" in context.inferenceContext
                ? (context.inferenceContext.estimatedCUs as CUResult)
                : undefined,
            // TODO: IDK why the middleware is not picking the types correctly. Maybe updating orpc fixes this.
            ratelimiters:
              "ratelimiters" in context.inferenceContext
                ? (context.inferenceContext.ratelimiters as ModelExecutionParams["ratelimiters"])
                : [],
          },
          chatContext,
        );

        if (context.ctx?.waitUntil) {
          context.ctx.waitUntil(agentPromise);
        } else {
          void agentPromise;
        }

        return {
          chatId: result.chatId,
          threadId: result.threadId,
          userMessageId: result.userMessage.id,
          assistantMessageId: result.assistantMessageId,
        };
      } catch (e) {
        Sentry.captureException(e, {
          user: { id: context.userCtx.user.id },
          extra: {
            chatId: result.chatId,
            threadId: result.threadId,
            assistantMessageId: result.assistantMessageId,
          },
        });
        console.error("Failed to create chat: ", e);
        await markMessageAsErrored(db, result.assistantMessageId, "Failed to create chat");
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create chat",
        });
      }
    }),

  sendMessage: osBase
    .use(verifiedSessionMiddleware)
    .input(
      z.object({
        chatId: z.string().uuid(),
        model: z.enum(MODELS),
        parentMessageId: z.string().uuid().nullable(),
        message: z.string().min(1).max(10000),
        webSearchEnabled: z.boolean().optional(),
        reasoningLevel: z.enum(REASONING_LEVELS).optional(),
        draftId: z.string().uuid().optional(),
        byokId: z.string().uuid().optional(),
      }),
    )
    .use(activeChatMiddleware)
    .use(inferenceMiddleware)
    .handler(async ({ context, input }) => {
      const actualReasoningLevel = input.reasoningLevel ?? context.chat.reasoningLevel;
      const actualModel = input.model ?? context.chat.model;
      const actualWebSearchEnabled = input.webSearchEnabled ?? context.chat.webSearchEnabled;

      let result;
      try {
        result = await db.transaction(async (tx) => {
          const { userMessageId, assistantMessageId, threadId, chatId } =
            await createReplyUserMessageAndAssistantMessage(tx, {
              userId: context.userCtx.user.id,
              parentMessageId: input.parentMessageId,
              message: input.message,
              model: actualModel,
              chatId: context.chat.id,
            });

          await findAndUpdateChat(tx, chatId, context.userCtx.user.id, {
            model: actualModel,
            webSearchEnabled: actualWebSearchEnabled,
            reasoningLevel: actualReasoningLevel,
          });

          // Delete draft if provided
          if (input.draftId) {
            await tx
              .delete(draftsTable)
              .where(
                and(
                  eq(draftsTable.id, input.draftId),
                  eq(draftsTable.userId, context.userCtx.user.id),
                ),
              );
          }

          return {
            userMessageId,
            assistantMessageId,
            threadId,
            chatId,
          };
        });
      } catch (e) {
        Sentry.captureException(e, {
          user: { id: context.userCtx.user.id },
          extra: {
            chatId: context.chat.id,
          },
        });
        console.error("Failed to create reply user message and assistant message: ", e);
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create message",
        });
      }

      posthog?.capture({
        distinctId: context.userCtx.user.id,
        event: "v1_message_sent",
        properties: {
          chatId: input.chatId,
          model: actualModel,
          webSearchEnabled: actualWebSearchEnabled,
          reasoningLevel: actualReasoningLevel,
          userMessageId: result.userMessageId,
          assistantMessageId: result.assistantMessageId,
          threadId: result.threadId,
        },
      });
      let messages;
      try {
        messages = await fetchThreadMessagesRecursive(db, result.threadId, {
          lastMessageId: result.userMessageId,
        });
      } catch (e) {
        Sentry.captureException(e, {
          user: { id: context.userCtx.user.id },
          extra: {
            chatId: result.chatId,
            threadId: result.threadId,
            assistantMessageId: result.assistantMessageId,
            userMessageId: result.userMessageId,
          },
        });
        console.error("Failed to retrieve messages: ", e);
        await markMessageAsErrored(db, result.assistantMessageId, "Failed to retrieve messages");
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to retrieve messages",
        });
      }

      try {
        const chatContext = await initializeChatContext({
          userId: context.userCtx.user.id,
          userAlias: context.userCtx.user.name,
          chatId: result.chatId,
          threadId: result.threadId,
          currentMessageId: result.assistantMessageId,
          messages: messages,
          modelId: input.model,
        });

        const agentPromise = executeAgentSafely(
          {
            model: actualModel,
            reasoningLevel: actualReasoningLevel,
            webSearchEnabled: actualWebSearchEnabled,
            openRouterKey: context.inferenceContext.key,
            publicUsage: context.inferenceContext.publicUsage,
            // TODO: IDK why the middleware is not picking the types correctly. Maybe updating orpc fixes this.
            estimatedCUs:
              "estimatedCUs" in context.inferenceContext
                ? (context.inferenceContext.estimatedCUs as CUResult)
                : undefined,
            // TODO: IDK why the middleware is not picking the types correctly. Maybe updating orpc fixes this.
            ratelimiters:
              "ratelimiters" in context.inferenceContext
                ? (context.inferenceContext.ratelimiters as ModelExecutionParams["ratelimiters"])
                : [],
          },
          chatContext,
        );

        if (context.ctx?.waitUntil) {
          context.ctx.waitUntil(agentPromise);
        } else {
          void agentPromise;
        }

        return {
          userMessageId: result.userMessageId,
          assistantMessageId: result.assistantMessageId,
          threadId: result.threadId,
          chatId: result.chatId,
        };
      } catch (e) {
        Sentry.captureException(e, {
          user: { id: context.userCtx.user.id },
          extra: {
            chatId: result.chatId,
            threadId: result.threadId,
            assistantMessageId: result.assistantMessageId,
            userMessageId: result.userMessageId,
          },
        });
        console.error("Failed to send message: ", e);
        await markMessageAsErrored(db, result.assistantMessageId, "Failed to send message");
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to send message",
        });
      }
    }),

  regenerateMessage: osBase
    .use(verifiedSessionMiddleware)
    .input(
      z.object({
        chatId: z.string().uuid(),
        model: z.enum(MODELS),
        messageId: z.string().uuid(),
        byokId: z.string().uuid().optional(),
      }),
    )
    .use(activeChatMiddleware)
    .use(inferenceMiddleware)
    .handler(async ({ context, input }) => {
      const result = await db.transaction(async (tx) => {
        const { message, parentMessage } = await regenerateMessage(tx, {
          userId: context.userCtx.user.id,
          messageId: input.messageId,
          model: input.model,
        });

        await findAndUpdateChat(tx, message.chatId, context.userCtx.user.id, {
          model: input.model,
        });

        posthog?.capture({
          distinctId: context.userCtx.user.id,
          event: "v1_message_regenerated",
          properties: {
            chatId: message.chatId,
            messageId: input.messageId,
            model: input.model,
          },
        });

        return {
          message,
          parentMessage,
        };
      });

      let messages;
      try {
        messages = await fetchThreadMessagesRecursive(db, result.parentMessage.threadId, {
          lastMessageId: result.parentMessage.id,
        });
      } catch (e) {
        Sentry.captureException(e, {
          user: { id: context.userCtx.user.id },
          extra: {
            chatId: result.message.chatId,
            threadId: result.message.threadId,
            messageId: result.message.id,
          },
        });
        console.error("Failed to retrieve messages", e);
        await markMessageAsErrored(db, result.message.id, "Failed to retrieve messages");
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to retrieve messages",
        });
      }

      try {
        const chatContext = await initializeChatContext({
          userId: context.userCtx.user.id,
          userAlias: context.userCtx.user.name,
          chatId: result.message.chatId,
          threadId: result.message.threadId,
          currentMessageId: result.message.id,
          messages: messages,
          modelId: input.model,
        });

        const agentPromise = executeAgentSafely(
          {
            model: input.model,
            reasoningLevel: result.message.reasoningLevel,
            webSearchEnabled: result.message.webSearchEnabled,
            openRouterKey: context.inferenceContext.key,
            publicUsage: context.inferenceContext.publicUsage,
            // TODO: IDK why the middleware is not picking the types correctly. Maybe updating orpc fixes this.
            estimatedCUs:
              "estimatedCUs" in context.inferenceContext
                ? (context.inferenceContext.estimatedCUs as CUResult)
                : undefined,
            // TODO: IDK why the middleware is not picking the types correctly. Maybe updating orpc fixes this.
            ratelimiters:
              "ratelimiters" in context.inferenceContext
                ? (context.inferenceContext.ratelimiters as ModelExecutionParams["ratelimiters"])
                : [],
          },
          chatContext,
        );

        if (context.ctx?.waitUntil) {
          context.ctx.waitUntil(agentPromise);
        } else {
          void agentPromise;
        }

        return {
          messageId: result.message.id,
          threadId: result.message.threadId,
          chatId: result.message.chatId,
        };
      } catch (e) {
        Sentry.captureException(e, {
          user: { id: context.userCtx.user.id },
          extra: {
            chatId: result.message.chatId,
            threadId: result.message.threadId,
            messageId: result.message.id,
          },
        });
        console.error("Error invoking agent: ", e);
        await markMessageAsErrored(db, result.message.id, "Failed to regenerate message");
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to regenerate message",
        });
      }
    }),

  cancelMessage: osBase
    .use(sessionMiddleware)
    .input(z.object({ chatId: z.string().uuid(), messageId: z.string().uuid() }))
    .use(activeChatMiddleware)
    .handler(async ({ context, input }) => {
      const [message] = await db
        .select({
          status: messageTable.status,
        })
        .from(messageTable)
        .where(
          and(
            eq(messageTable.id, input.messageId),
            eq(messageTable.userId, context.userCtx.user.id),
          ),
        );

      if (!message) {
        throw new ORPCError("NOT_FOUND", {
          message: "Message not found",
        });
      }

      if (message.status === "waiting_confirmation") {
        await db
          .update(messageTable)
          .set({ status: "cancelled" })
          .where(eq(messageTable.id, input.messageId));
      } else if (message.status !== "processing") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Message is not in progress",
        });
      }

      await sendCancelMessage(input.messageId);
    }),

  renameChat: osBase
    .use(sessionMiddleware)
    .input(z.object({ chatId: z.string().uuid(), newTitle: chatTitleSchema }))
    .use(activeChatMiddleware)
    .handler(async ({ input }) => {
      await renameChat(db, input.chatId, input.newTitle);

      return {
        chatId: input.chatId,
        newTitle: input.newTitle,
      };
    }),

  deleteChat: osBase
    .use(sessionMiddleware)
    .input(z.object({ chatId: z.string().uuid() }))
    .use(chatOwnerMiddleware)
    .handler(async ({ input, context }) => {
      if (context.chat.deletedAt) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Chat is already deleted",
        });
      }

      await deleteChat(db, input.chatId);

      return {
        chatId: input.chatId,
      };
    }),

  permanentlyDeleteChat: osBase
    .use(sessionMiddleware)
    .input(z.object({ chatId: z.string().uuid() }))
    .use(chatOwnerMiddleware)
    .handler(async ({ input, context }) => {
      if (!context.chat.deletedAt) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Chat is not deleted",
        });
      }

      await permanentlyDeleteChat(db, input.chatId);

      return {
        chatId: input.chatId,
      };
    }),

  archiveChat: osBase
    .use(sessionMiddleware)
    .input(z.object({ chatId: z.string().uuid() }))
    .use(chatOwnerMiddleware)
    .handler(async ({ input, context }) => {
      if (context.chat.deletedAt) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Chat is deleted",
        });
      }

      if (context.chat.archived) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Chat is already archived",
        });
      }

      await archiveChat(db, input.chatId);

      return {
        chatId: input.chatId,
        archived: true,
      };
    }),

  unarchiveChat: osBase
    .use(sessionMiddleware)
    .input(z.object({ chatId: z.string().uuid() }))
    .use(chatOwnerMiddleware)
    .handler(async ({ input, context }) => {
      if (context.chat.deletedAt) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Chat is deleted",
        });
      }

      if (!context.chat.archived) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Chat is not archived",
        });
      }

      await unarchiveChat(db, input.chatId);

      return {
        chatId: input.chatId,
        archived: false,
      };
    }),

  restoreChat: osBase
    .use(sessionMiddleware)
    .input(z.object({ chatId: z.string().uuid() }))
    .use(chatOwnerMiddleware)
    .handler(async ({ input, context }) => {
      if (!context.chat.deletedAt) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Chat is not deleted",
        });
      }

      await restoreChat(db, input.chatId);

      return {
        chatId: input.chatId,
      };
    }),

  pinChat: osBase
    .use(sessionMiddleware)
    .input(z.object({ chatId: z.string().uuid(), pinned: z.boolean() }))
    .use(chatOwnerMiddleware)
    .handler(async ({ input }) => {
      await db
        .update(chatTable)
        .set({ pinned: input.pinned, updatedAt: new Date() })
        .where(eq(chatTable.id, input.chatId));

      return {
        chatId: input.chatId,
        pinned: input.pinned,
      };
    }),
});
