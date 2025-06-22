import { z } from "zod/v4";
import { createOpenAIClient } from "../utils/client";
import * as Sentry from "@sentry/sveltekit";

export interface GenerateChatTitleContext {
  userId: string;
  chatId: string;
  threadId: string;
  userMessageId: string;
}

const schema = z.object({
  title: z.string().describe("A short, descriptive chat title"),
});

export async function generateChatTitle(
  context: GenerateChatTitleContext,
  firstMessage: string,
  apiKey: string,
  model: string,
) {
  const response = await createOpenAIClient(apiKey).chat.completions.create({
    model: model,
    messages: [
      {
        role: "system",
        content: "Create a concise title (max 6 words, title case) summarizing the user message. ",
      },
      {
        role: "user",
        content: firstMessage,
      },
    ],
    user: context.userId,
    response_format: {
      type: "json_schema",
      json_schema: { name: "title", schema: z.toJSONSchema(schema), strict: true },
    },
    stream: false,
  });

  if (!response.choices[0].message.content) {
    Sentry.captureException(new Error("No content in chat title response"), {
      user: { id: context.userId },
      extra: {
        chatId: context.chatId,
        threadId: context.threadId,
        userMessageId: context.userMessageId,
      },
    });
    console.error("No content in response", response);
    return null;
  }

  const parsed = schema.safeParse(JSON.parse(response.choices[0].message.content));

  if (!parsed.success) {
    Sentry.captureException(parsed.error, {
      user: { id: context.userId },
      extra: {
        chatId: context.chatId,
        threadId: context.threadId,
        userMessageId: context.userMessageId,
        rawResponse: response.choices[0].message.content,
      },
    });
    console.error("Invalid response", parsed.error);
    return null;
  }

  return parsed.data.title;
}
