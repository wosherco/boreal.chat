import { osBase } from "../../context";
import { z } from "zod";
import { LLAMA_3_1_8B, LLAMA_3_3_8B_FREE, MODELS, REASONING_LEVELS } from "$lib/common/ai/models";
import { createAgent, invokeAgent } from "$lib/server/ai/agents/main";
import { db } from "$lib/server/db";
import { chatOwnerMiddleware, openRouterMiddleware } from "../../middlewares";
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
import { eq } from "drizzle-orm";
import { chatTable } from "$lib/server/db/schema";
import { ORPCError } from "@orpc/client";
import { RateLimitError } from "openai";
import * as Sentry from "@sentry/sveltekit";
import { posthog } from "$lib/server/posthog";

export const v1ChatRouter = osBase.router({
  newChat: osBase
    .use(openRouterMiddleware)
    .input(
      z.object({
        model: z.enum(MODELS),
        message: z.string().min(1).max(10000),
        webSearchEnabled: z.boolean().optional(),
        reasoningLevel: z.enum(REASONING_LEVELS).optional(),
      }),
    )
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
          context.openRouterKey.apiKey,
          input.model.endsWith(":free") ? LLAMA_3_3_8B_FREE : LLAMA_3_1_8B,
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
        const agent = createAgent(input.model, context.openRouterKey.apiKey, {
          thinking: defaultThinkingLevel,
          webSearchEnabled: input.webSearchEnabled ?? false,
        });

        // Initialize the context properly
        const chatContext = initializeChatContext({
          userId: context.userCtx.user.id,
          userAlias: context.userCtx.user.name,
          chatId: result.chatId,
          threadId: result.threadId,
          currentMessageId: result.assistantMessageId,
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
                },
              ],
            },
          ],
        });

        // Invoke the agent with the initialized context
        const agentPromise = invokeAgent(agent, chatContext)
          .then(() => {
            posthog?.capture({
              distinctId: context.userCtx.user.id,
              event: "agent_invocation_succeeded",
              properties: {
                type: "newChat",
                chatId: result.chatId,
                assistantMessageId: result.assistantMessageId,
                model: input.model,
              },
            });
          })
          .catch(async (error) => {
            Sentry.captureException(error, {
              user: { id: context.userCtx.user.id },
              extra: {
                chatId: result.chatId,
                threadId: result.threadId,
                assistantMessageId: result.assistantMessageId,
              },
            });
            posthog?.capture({
              distinctId: context.userCtx.user.id,
              event: "agent_invocation_failed",
              properties: {
                type: "newChat",
                chatId: result.chatId,
                assistantMessageId: result.assistantMessageId,
                model: input.model,
              },
            });
            await markMessageAsErrored(
              db,
              result.assistantMessageId,
              "Agent failed to create chat",
            );
            console.error("Error invoking agent: ", error);
          });

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
    .use(openRouterMiddleware)
    .input(
      z.object({
        chatId: z.string().uuid(),
        model: z.enum(MODELS).optional(),
        parentMessageId: z.string().uuid().nullable(),
        message: z.string().min(1).max(10000),
        webSearchEnabled: z.boolean().optional(),
        reasoningLevel: z.enum(REASONING_LEVELS).optional(),
      }),
    )
    .use(chatOwnerMiddleware)
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
        const agent = createAgent(actualModel, context.openRouterKey.apiKey, {
          thinking: actualReasoningLevel,
          webSearchEnabled: actualWebSearchEnabled,
        });

        const chatContext = initializeChatContext({
          userId: context.userCtx.user.id,
          userAlias: context.userCtx.user.name,
          chatId: result.chatId,
          threadId: result.threadId,
          currentMessageId: result.assistantMessageId,
          messages: messages,
        });

        const agentPromise = invokeAgent(agent, chatContext)
          .then(() => {
            posthog?.capture({
              distinctId: context.userCtx.user.id,
              event: "agent_invocation_succeeded",
              properties: {
                type: "sendMessage",
                chatId: result.chatId,
                assistantMessageId: result.assistantMessageId,
                model: actualModel,
              },
            });
          })
          .catch(async (error) => {
            let errorMessage = "Agent failed to send message";

            if (error instanceof RateLimitError) {
              errorMessage =
                "Rate limit exceeded. If you're using a free model, try using a paid model.";
            }

            Sentry.captureException(error, {
              user: { id: context.userCtx.user.id },
              extra: {
                chatId: result.chatId,
                threadId: result.threadId,
                assistantMessageId: result.assistantMessageId,
                userMessageId: result.userMessageId,
              },
            });
            posthog?.capture({
              distinctId: context.userCtx.user.id,
              event: "agent_invocation_failed",
              properties: {
                type: "sendMessage",
                chatId: result.chatId,
                assistantMessageId: result.assistantMessageId,
                model: actualModel,
              },
            });
            await markMessageAsErrored(db, result.assistantMessageId, errorMessage);
            console.error("Failed to send message: ", error);
          });

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
    .use(openRouterMiddleware)
    .input(
      z.object({
        model: z.enum(MODELS),
        messageId: z.string().uuid(),
      }),
    )
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
        const agent = createAgent(input.model, context.openRouterKey.apiKey, {
          thinking: result.message.reasoningLevel,
          webSearchEnabled: result.message.webSearchEnabled,
        });

        const chatContext = initializeChatContext({
          userId: context.userCtx.user.id,
          userAlias: context.userCtx.user.name,
          chatId: result.message.chatId,
          threadId: result.message.threadId,
          currentMessageId: result.message.id,
          messages: messages,
        });

        const agentPromise = invokeAgent(agent, chatContext)
          .then(() => {
            posthog?.capture({
              distinctId: context.userCtx.user.id,
              event: "agent_invocation_succeeded",
              properties: {
                type: "regenerateMessage",
                chatId: result.message.chatId,
                messageId: result.message.id,
                model: input.model,
              },
            });
          })
          .catch(async (error) => {
            Sentry.captureException(error, {
              user: { id: context.userCtx.user.id },
              extra: {
                chatId: result.message.chatId,
                threadId: result.message.threadId,
                messageId: result.message.id,
              },
            });
            posthog?.capture({
              distinctId: context.userCtx.user.id,
              event: "agent_invocation_failed",
              properties: {
                type: "regenerateMessage",
                chatId: result.message.chatId,
                messageId: result.message.id,
                model: input.model,
              },
            });
            await markMessageAsErrored(db, result.message.id, "Agent failed to regenerate message");
            console.error("Error invoking agent: ", error);
          });

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
});
