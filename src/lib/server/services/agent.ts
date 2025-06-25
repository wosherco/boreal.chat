import type { ModelId, ReasoningLevel } from "$lib/common/ai/models";
import { createAgent, invokeAgent } from "../ai/agents/main";
import type { ChatContext } from "../ai/state";
import { posthog } from "../posthog";
import * as Sentry from "@sentry/sveltekit";
import { markMessageAsErrored } from "./messages";
import { db } from "../db";
import { RateLimitError } from "openai";
import { listenForCancelMessage } from "../db/mq/messageCancellation";

export async function executeAgentSafely(
  params: {
    model: ModelId;
    openRouterKey: string;
    reasoningLevel: ReasoningLevel;
    webSearchEnabled: boolean;
  },
  context: ChatContext,
) {
  const abortController = new AbortController();

  const cancelListener = await listenForCancelMessage(context.currentMessageId, () => {
    abortController.abort();
  });

  const agent = createAgent(params.model, params.openRouterKey, {
    thinking: params.reasoningLevel,
    webSearchEnabled: params.webSearchEnabled,
    abortSignal: abortController.signal,
  });

  return invokeAgent(agent, context)
    .then(() => {
      posthog?.capture({
        distinctId: context.userId,
        event: "agent_invocation_succeeded",
        properties: {
          type: "regenerateMessage",
          chatId: context.chatId,
          messageId: context.currentMessageId,
          model: params.model,
        },
      });
    })
    .catch(async (error) => {
      let errorMessage = "Agent failed to send message";

      if (error instanceof RateLimitError) {
        errorMessage = "Rate limit exceeded. If you're using a free model, try using a paid model.";
      }

      Sentry.captureException(error, {
        user: { id: context.userId },
        extra: {
          chatId: context.chatId,
          threadId: context.threadId,
          messageId: context.currentMessageId,
        },
      });
      posthog?.capture({
        distinctId: context.userId,
        event: "agent_invocation_failed",
        properties: {
          type: "regenerateMessage",
          chatId: context.chatId,
          messageId: context.currentMessageId,
          model: params.model,
        },
      });
      await markMessageAsErrored(db, context.currentMessageId, errorMessage);
      console.error("Error invoking agent: ", error);
    })
    .finally(() => {
      cancelListener.unlisten();
    });
}
