import {
  addWebSearchToModel,
  MODEL_DETAILS,
  type ModelId,
  type ReasoningLevel,
} from "$lib/common/ai/models";
import { StateGraph } from "@langchain/langgraph";
import { ChatContextAnnotation, type ChatContext } from "../state";
import OpenAI, { APIUserAbortError } from "openai";
import { dispatchCustomEvent } from "@langchain/core/callbacks/dispatch";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import BufferedTokenInsert from "../utils/BufferedTokenInsert";
import { db } from "../../db";
import { messageSegmentUsageTable, messageTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import { createOpenAIClient } from "../utils/client";
import { getUsageData } from "$lib/server/services/openapi";
import * as Sentry from "@sentry/sveltekit";
import { calculateCUs, type CUResult } from "$lib/server/ratelimit/cu";
import { burstCULimiter, localCULimiter } from "$lib/server/ratelimit";

// Custom context interface that extends beyond just messages

interface AgentParameters {
  /**
   * If the model supports it, this will enable thinking.
   *
   * @default false
   */
  thinking?: ReasoningLevel;
  /**
   * @default 0.8
   */
  temperature?: number;
  /**
   * @default 8192
   */
  maxTokens?: number;
  /**
   * Will enable web search through openrouter.
   */
  webSearchEnabled?: boolean;
  /**
   * If the agent should be aborted.
   */
  abortSignal?: AbortSignal;
}

const STREAMED_REASONING_TOKEN = "streamed_reasoning_token";
const STREAMED_TOKEN = "streamed_token";
const STREAMED_TOOL_CALL_CHUNK = "streamed_tool_call_chunk";
const MESSAGE_FINISHED = "message_finished";

type StreamedReasoningTokenEvent = {
  name: typeof STREAMED_REASONING_TOKEN;
  data: {
    reasoning: string;
    generationId: string;
  };
};

type StreamedTokenEvent = {
  name: typeof STREAMED_TOKEN;
  data: {
    content: string;
    generationId: string;
  };
};

type StreamedToolCallChunkEvent = {
  name: typeof STREAMED_TOOL_CALL_CHUNK;
  data: {
    toolCall: ChatCompletionChunk.Choice.Delta.ToolCall;
  };
};

type MessageFinishedEvent = {
  name: typeof MESSAGE_FINISHED;
  data: {
    message: OpenAI.ChatCompletionMessageParam;
    generationId: string;
    cancelled: boolean;
  };
};

type StreamEvent =
  | StreamedReasoningTokenEvent
  | StreamedTokenEvent
  | StreamedToolCallChunkEvent
  | MessageFinishedEvent;

export function createAgent(
  model: ModelId,
  openRouterKey: string,
  parameters: AgentParameters = {},
) {
  async function callModel(state: ChatContext) {
    let actualModel: string = model;

    if (parameters.webSearchEnabled === true) {
      actualModel = addWebSearchToModel(actualModel);
    }

    if (typeof MODEL_DETAILS[model].reasoning === "string" && parameters.thinking) {
      actualModel = MODEL_DETAILS[model].reasoning;
    }

    const stream = await createOpenAIClient(openRouterKey).chat.completions.create(
      {
        model: actualModel,
        messages: state.messages,
        user: state.userId,
        stream: true,
        reasoning_effort:
          parameters.thinking === undefined
            ? undefined
            : parameters.thinking === "none"
              ? null
              : parameters.thinking,
        temperature: parameters.temperature ?? 0.8,
        max_tokens: parameters.maxTokens ?? 8192,
      },
      {
        signal: parameters.abortSignal,
      },
    );

    let generationId: string | undefined;
    let responseReasoning = "";
    let responseContent = "";
    let role: OpenAI.ChatCompletionMessageParam["role"] = "assistant";
    let toolCallId: string | undefined;
    let toolCallName: string | undefined;
    let toolCallArgs = "";

    let cancelled = false;
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0].delta;

        if (chunk.id !== undefined) {
          generationId = chunk.id;
        }

        if (delta.role !== undefined) {
          role = delta.role;
        }

        if ((delta as { reasoning: string }).reasoning) {
          responseReasoning += (delta as { reasoning: string }).reasoning;

          await dispatchCustomEvent(STREAMED_REASONING_TOKEN, {
            reasoning: (delta as { reasoning: string }).reasoning,
            generationId: chunk.id,
          } satisfies StreamedReasoningTokenEvent["data"]);
        }

        if (delta.content) {
          responseContent += delta.content;

          await dispatchCustomEvent(STREAMED_TOKEN, {
            content: delta.content,
            generationId: chunk.id,
          } satisfies StreamedTokenEvent["data"]);
        }

        if (delta.tool_calls !== undefined && delta.tool_calls.length > 0) {
          // note: for simplicity we're only handling a single tool call here
          const toolCall = delta.tool_calls[0];
          if (toolCall.function?.name !== undefined) {
            toolCallName = toolCall.function.name;
          }
          if (toolCall.id !== undefined) {
            toolCallId = toolCall.id;
          }
          await dispatchCustomEvent(STREAMED_TOOL_CALL_CHUNK, {
            toolCall,
          } satisfies StreamedToolCallChunkEvent["data"]);
          toolCallArgs += toolCall.function?.arguments ?? "";
        }
      }
    } catch (e) {
      if (e instanceof APIUserAbortError) {
        cancelled = true;
      }
      throw e;
    }

    // At this point the LLM stream has finished. We're just getting stuff together.
    let finalToolCalls;
    if (toolCallName !== undefined && toolCallId !== undefined) {
      finalToolCalls = [
        {
          id: toolCallId,
          function: {
            name: toolCallName,
            arguments: toolCallArgs,
          },
          type: "function" as const,
        },
      ];
    }

    if (generationId === undefined) {
      throw new Error("Generation ID is undefined");
    }

    const responseMessage = {
      role: role,
      content: responseContent,
      // @ts-expect-error - I want to include the reasoning too.
      reasoning: responseReasoning,
      tool_calls: finalToolCalls,
    } satisfies OpenAI.ChatCompletionMessageParam;

    await dispatchCustomEvent(MESSAGE_FINISHED, {
      message: responseMessage as OpenAI.ChatCompletionMessageParam,
      generationId,
      cancelled,
    } satisfies MessageFinishedEvent["data"]);

    // TODO: https://langchain-ai.github.io/langgraphjs/how-tos/streaming-tokens-without-langchain/#define-tools-and-a-tool-calling-node

    return { messages: [responseMessage] };
  }

  const workflow = new StateGraph(ChatContextAnnotation)
    .addNode("agent", callModel)
    .addEdge("__start__", "agent")
    .addEdge("agent", "__end__");

  return {
    agent: workflow.compile(),
    openRouterKey,
  };
}

export async function invokeAgent(
  { agent, openRouterKey }: ReturnType<typeof createAgent>,
  context: ChatContext,
  params: {
    model: ModelId;
    publicUsage: boolean;
    estimatedCUs?: CUResult;
    ratelimit: undefined | "burst" | "local";
  },
) {
  const stream = await agent.streamEvents(context, { version: "v2" });
  const bufferedTokenInsert = new BufferedTokenInsert(context.userId, context.currentMessageId);

  try {
    for await (const eventData of stream) {
      const { name, data } = eventData as unknown as StreamEvent;

      switch (name) {
        case STREAMED_REASONING_TOKEN:
          bufferedTokenInsert.insert(data.generationId, "reasoning", data.reasoning);
          break;
        case STREAMED_TOKEN:
          bufferedTokenInsert.insert(data.generationId, "text", data.content);
          break;
        case STREAMED_TOOL_CALL_CHUNK:
          // TODO: Add support for tool calls.
          break;
        case MESSAGE_FINISHED:
          {
            await bufferedTokenInsert.destroy();

            if (data.message.role !== "assistant") {
              throw new Error("Message is not an assistant message");
            }

            await db
              .update(messageTable)
              .set({
                status: data.cancelled ? "cancelled" : "finished",
              })
              .where(eq(messageTable.id, context.currentMessageId))
              .execute();

            // Getting usage and saving it to DB
            let generationUsage: Awaited<ReturnType<typeof getUsageData>>;
            try {
              generationUsage = await getUsageData(openRouterKey, data.generationId);
            } catch (e) {
              console.error("Failed to get usage data", e);
              Sentry.captureException(e, {
                user: { id: context.userId },
                extra: {
                  chatId: context.chatId,
                  threadId: context.threadId,
                },
              });

              // We're refunding the estimated CUs.
              if (params.ratelimit && params.estimatedCUs) {
                const ratelimiter = params.ratelimit === "burst" ? burstCULimiter : localCULimiter;
                await ratelimiter.addTokens(context.userId, params.estimatedCUs.total);
              }

              // We will keep the estimated CUs, since it's fair most of the times.
              return;
            }

            // We'll try adding the usage. If it doesn't work out, we'll just log the error.
            try {
              let actualOutputCUs: number | undefined;

              if (params.ratelimit && params.estimatedCUs) {
                const actualCUs = calculateCUs(
                  // The input we'll keep the estimated for now. We're not charging on previous messages for now.
                  0,
                  generationUsage.tokens_completion,
                  params.model,
                );
                actualOutputCUs = actualCUs.outputCUs;

                // We'll compare the estimated CUs with the actual CUs for output, and apply it to the ratelimit.

                /**
                 * Positive means we used more CUs than estimated. We're going to remove them from the ratelimit.
                 * Negative means we used less CUs than estimated. We're going to add them to the ratelimit.
                 */
                const diffOutput = actualCUs.outputCUs - params.estimatedCUs.outputCUs;

                const ratelimiter = params.ratelimit === "burst" ? burstCULimiter : localCULimiter;
                if (diffOutput > 0) {
                  await ratelimiter.removeTokens(context.userId, diffOutput);
                } else {
                  await ratelimiter.addTokens(context.userId, Math.abs(diffOutput));
                }
              }

              await db.insert(messageSegmentUsageTable).values({
                userId: context.userId,
                generationId: data.generationId,
                private: !params.publicUsage,

                estimatedCUs: params.estimatedCUs?.total
                  ? Math.round(params.estimatedCUs.total)
                  : undefined,
                actualCUs: actualOutputCUs ? Math.round(actualOutputCUs) : undefined,

                isByok: generationUsage.is_byok,
                model: generationUsage.model,
                origin: generationUsage.origin,
                providerName: generationUsage.provider_name,
                usage: generationUsage.usage,
                cacheDiscount: generationUsage.cache_discount,
                tokensPrompt: generationUsage.tokens_prompt,
                tokensCompletion: generationUsage.tokens_completion,
                numMediaPrompt: generationUsage.num_media_prompt,
                numMediaCompletion: generationUsage.num_media_completion,
                numSearchResults: generationUsage.num_search_results,
              });
            } catch (e) {
              console.error("Failed to insert message segment usage", e);
              Sentry.captureException(e, {
                user: { id: context.userId },
              });
            }
          }
          break;
      }
    }
  } catch (e) {
    console.error("Error streaming message", e);
    Sentry.captureException(e, {
      user: { id: context.userId },
      extra: {
        chatId: context.chatId,
        currentMessageId: context.currentMessageId,
      },
    });

    await db
      .update(messageTable)
      .set({
        // Ideally "error", but we'll use "cancelled" for now.
        status: "error",
        error: "Token streaming cut off for unknown reason",
      })
      .where(eq(messageTable.id, context.currentMessageId));
  } finally {
    await bufferedTokenInsert.destroy();
  }
}
