import {
  addWebSearchToModel,
  MODEL_DETAILS,
  type ModelId,
  type ReasoningLevel,
} from "$lib/common/ai/models";
import { StateGraph } from "@langchain/langgraph";
import { ChatContextAnnotation, type ChatContext } from "../state";
import OpenAI from "openai";
import { dispatchCustomEvent } from "@langchain/core/callbacks/dispatch";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import BufferedTokenInsert from "../utils/BufferedTokenInsert";
import { db } from "../../db";
import {
  messageSegmentsTable,
  messageSegmentMetadataTable,
  messageTable,
  messageTokensTable,
} from "../../db/schema";
import { eq } from "drizzle-orm";
import { createOpenAIClient } from "../utils/client";

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
   * If the model is free, this will enable the free model.
   */
  useFreeModel?: boolean;
}

const STREAMED_REASONING_TOKEN = "streamed_reasoning_token";
const STREAMED_TOKEN = "streamed_token";
const STREAMED_TOOL_CALL_CHUNK = "streamed_tool_call_chunk";
const MESSAGE_FINISHED = "message_finished";
const USAGE_INFO = "usage_info";

type StreamedReasoningTokenEvent = {
  name: typeof STREAMED_REASONING_TOKEN;
  data: {
    reasoning: string;
  };
};

type StreamedTokenEvent = {
  name: typeof STREAMED_TOKEN;
  data: {
    content: string;
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
  };
};

type UsageInfoEvent = {
  name: typeof USAGE_INFO;
  data: {
    usage: OpenAI.ChatCompletionUsage;
  };
};

type StreamEvent =
  | StreamedReasoningTokenEvent
  | StreamedTokenEvent
  | StreamedToolCallChunkEvent
  | MessageFinishedEvent
  | UsageInfoEvent;

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

    const stream = await createOpenAIClient(openRouterKey).chat.completions.create({
      model: actualModel,
      messages: state.messages,
      stream: true,
      usage: { include: true },
      reasoning_effort:
        parameters.thinking === undefined
          ? undefined
          : parameters.thinking === "none"
            ? null
            : parameters.thinking,
      temperature: parameters.temperature ?? 0.8,
      max_tokens: parameters.maxTokens ?? 8192,
    });

    let responseReasoning = "";
    let responseContent = "";
    let role: OpenAI.ChatCompletionMessageParam["role"] = "assistant";
    let toolCallId: string | undefined;
    let toolCallName: string | undefined;
    let toolCallArgs = "";
    let usageInfo: OpenAI.ChatCompletionUsage | undefined;

    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta;

      if (delta.role !== undefined) {
        role = delta.role;
      }

      if ((delta as { reasoning: string }).reasoning) {
        responseReasoning += (delta as { reasoning: string }).reasoning;

        await dispatchCustomEvent(STREAMED_REASONING_TOKEN, {
          reasoning: (delta as { reasoning: string }).reasoning,
        } satisfies StreamedReasoningTokenEvent["data"]);
      }

      if (delta.content) {
        responseContent += delta.content;

        await dispatchCustomEvent(STREAMED_TOKEN, {
          content: delta.content,
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

      if ((chunk as { usage?: OpenAI.ChatCompletionUsage }).usage) {
        usageInfo = (chunk as { usage: OpenAI.ChatCompletionUsage }).usage;
      }
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

    const responseMessage = {
      role: role,
      content: responseContent,
      // @ts-expect-error - I want to include the reasoning too.
      reasoning: responseReasoning,
      tool_calls: finalToolCalls,
    } satisfies OpenAI.ChatCompletionMessageParam;

    await dispatchCustomEvent(MESSAGE_FINISHED, {
      message: responseMessage as OpenAI.ChatCompletionMessageParam,
    } satisfies MessageFinishedEvent["data"]);

    if (usageInfo) {
      await dispatchCustomEvent(USAGE_INFO, {
        usage: usageInfo,
      } satisfies UsageInfoEvent["data"]);
    }

    // TODO: https://langchain-ai.github.io/langgraphjs/how-tos/streaming-tokens-without-langchain/#define-tools-and-a-tool-calling-node

    return { messages: [responseMessage] };
  }

  const workflow = new StateGraph(ChatContextAnnotation)
    .addNode("agent", callModel)
    .addEdge("__start__", "agent")
    .addEdge("agent", "__end__");

  return workflow.compile();
}

export async function invokeAgent(agent: ReturnType<typeof createAgent>, context: ChatContext) {
  const stream = await agent.streamEvents(context, { version: "v2" });
  const bufferedTokenInsert = new BufferedTokenInsert(context.userId, context.currentMessageId);
  let usageInfo: OpenAI.ChatCompletionUsage | null = null;

  for await (const eventData of stream) {
    const { name, data } = eventData as unknown as StreamEvent;

    switch (name) {
      case STREAMED_REASONING_TOKEN:
        bufferedTokenInsert.insert("reasoning", data.reasoning);
        break;
      case STREAMED_TOKEN:
        bufferedTokenInsert.insert("text", data.content);
        break;
      case STREAMED_TOOL_CALL_CHUNK:
        // TODO: Add support for tool calls.
        break;
      case USAGE_INFO:
        usageInfo = data.usage;
        break;
      case MESSAGE_FINISHED:
        {
          await bufferedTokenInsert.flushImmediate();
          await bufferedTokenInsert.destroy();

          if (data.message.role !== "assistant") {
            throw new Error("Message is not an assistant message");
          }

          const reasoning = (data.message as { reasoning?: string }).reasoning;

          const getTextFromMessage = (
            message: OpenAI.ChatCompletionMessageParam,
          ): string | null => {
            if (message.content) {
              if (typeof message.content === "string") {
                return message.content;
              }
              if (Array.isArray(message.content)) {
                return message.content
                  .map((part) =>
                    "text" in part ? part.text : "refusal" in part ? part.refusal : null,
                  )
                  .filter((text) => text !== null)
                  .join("");
              }
            }
            return null;
          };
          const content = getTextFromMessage(data.message);

          let i = 0;
          const toInsertMessages: (typeof messageSegmentsTable.$inferInsert)[] = [];

          if (reasoning) {
            toInsertMessages.push({
              userId: context.userId,
              messageId: context.currentMessageId,
              // TODO: Ordinal will need a more complex logic when we implement tools.
              ordinal: i,
              kind: "reasoning",
              content: reasoning,
            });

            i++;
          }

          if (content) {
            toInsertMessages.push({
              userId: context.userId,
              messageId: context.currentMessageId,
              ordinal: i,
              kind: "text",
              content: content,
            });
            i++;
          }

          const updatePromise = db
            .update(messageTable)
            .set({
              status: "finished",
            })
            .where(eq(messageTable.id, context.currentMessageId))
            .execute();

          let insertedSegments: { id: string }[] = [];
          if (toInsertMessages.length > 0) {
            insertedSegments = await db
              .insert(messageSegmentsTable)
              .values(toInsertMessages)
              .returning({ id: messageSegmentsTable.id });
          }

          await updatePromise;

          if (usageInfo && insertedSegments.length > 0) {
            await Promise.all(
              insertedSegments.map((seg) =>
                db.insert(messageSegmentMetadataTable).values({
                  messageSegmentId: seg.id,
                  promptTokens: usageInfo.prompt_tokens,
                  completionTokens: usageInfo.completion_tokens,
                  reasoningTokens: usageInfo.completion_tokens_details?.reasoning_tokens ?? 0,
                  cachedTokens: usageInfo.prompt_tokens_details?.cached_tokens ?? 0,
                  totalTokens: usageInfo.total_tokens,
                  cost: usageInfo.cost,
                  upstreamInferenceCost: usageInfo.cost_details?.upstream_inference_cost ?? null,
                })
              )
            );
            usageInfo = null;
          }

          // Cleaning up temporal tokens
          await db
            .delete(messageTokensTable)
            .where(eq(messageTokensTable.messageId, context.currentMessageId));
        }
        break;
    }
  }
}
