import type { ModelId, ReasoningLevel } from "$lib/common/ai/models";
import { createAgent, invokeAgent } from "../ai/agents/main";
import type { ChatContext } from "../ai/state";
import { posthog } from "../posthog";
import * as Sentry from "@sentry/sveltekit";
import { markMessageAsErrored } from "./messages";
import { db } from "../db";
import { RateLimitError } from "openai";
import { listenForCancelMessage } from "../db/mq/messageCancellation";
import type { CUResult } from "../ratelimit/cu";
import { burstCULimiter, localCULimiter } from "../ratelimit";

export async function executeAgentSafely(
  params: {
    model: ModelId;
    reasoningLevel: ReasoningLevel;
    webSearchEnabled: boolean;
    openRouterKey: string;
    publicUsage: boolean;
    ratelimit: undefined | "burst" | "local";
    estimatedCUs?: CUResult;
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

  return invokeAgent(agent, context, params)
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

      // We're refunding the estimated CUs.
      if (params.ratelimit && params.estimatedCUs) {
        const ratelimiter = params.ratelimit === "burst" ? burstCULimiter : localCULimiter;
        await ratelimiter.addTokens(context.userId, params.estimatedCUs.total);
      }
    })
    .finally(() => {
      cancelListener.unlisten();
    });
}
