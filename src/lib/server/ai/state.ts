import type { MessageWithSegments } from "$lib/common/sharedTypes";
import { Annotation } from "@langchain/langgraph";
import type OpenAI from "openai";
import { parseMainPrompt } from "./prompts/main";
import type { ModelId } from "$lib/common/ai/models";

export const ChatContextAnnotation = Annotation.Root({
  messages: Annotation<OpenAI.ChatCompletionMessageParam[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  currentMessageId: Annotation<string>(),
  userId: Annotation<string>(),
  chatId: Annotation<string>(),
  threadId: Annotation<string>(),
  resumeState: Annotation<"normal" | "was-waiting-for-confirmation">(),
});

export type ChatContext = typeof ChatContextAnnotation.State;

export async function initializeChatContext(params: {
  userId: string;
  userAlias: string;
  chatId: string;
  threadId: string;
  currentMessageId: string;
  messages: MessageWithSegments[];
  modelId: ModelId;
}): Promise<ChatContext> {
  const { messages, userId, chatId, threadId, currentMessageId, userAlias, modelId } = params;
  if (messages.length === 0) {
    throw new Error("No messages provided");
  }

  const lastMessage = messages[messages.length - 1];

  const resumeState =
    lastMessage.status === "waiting_confirmation" ? "was-waiting-for-confirmation" : "normal";

  const baseMessages = messages.reduce((acc, message) => {
    if (message.role === "user") {
      for (const segment of message.segments ?? []) {
        if (segment.kind === "text" && segment.content) {
          acc.push({
            role: "user",
            content: segment.content,
          });
        }

        // Other segment kinds are not supported for user messages
      }

      return acc;
    }

    // For AI messages
    for (const segment of message.segments ?? []) {
      switch (segment.kind) {
        case "text":
          if (segment.content) {
            acc.push({
              role: "assistant",
              content: segment.content,
            });
          }
          break;
        case "tool_call":
          if (segment.toolName && segment.toolArgs && segment.toolCallId) {
            acc.push({
              role: "assistant",
              content: segment.content ?? "",
              tool_calls: [
                {
                  type: "function",
                  id: segment.toolCallId,
                  function: {
                    name: segment.toolName,
                    arguments: JSON.stringify(segment.toolArgs),
                  },
                },
              ],
            });
          }
          break;
        case "tool_result":
          if (segment.toolResult && segment.toolName && segment.toolCallId) {
            acc.push({
              role: "tool",
              content: JSON.stringify(segment.toolResult),
              tool_call_id: segment.toolCallId,
            });
          }
          break;
      }
    }

    // Other roles are not supported for assistant messages
    return acc;
  }, [] as OpenAI.ChatCompletionMessageParam[]);

  return {
    userId,
    chatId,
    threadId,
    currentMessageId,
    resumeState,
    messages: [
      {
        role: "system",
        content: await parseMainPrompt({
          userAlias,
          model: modelId,
        }),
      },
      ...baseMessages,
    ],
  };
}
