import { z } from "zod/v4";
import { createOpenAIClient } from "../utils/client";

const schema = z.object({
  title: z.string().describe("A short, descriptive chat title"),
});

export async function generateChatTitle(firstMessage: string, apiKey: string, model: string) {
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
    response_format: {
      type: "json_schema",
      json_schema: { name: "title", schema: z.toJSONSchema(schema), strict: true },
    },
    stream: false,
  });

  if (!response.choices[0].message.content) {
    // TODO: Log this to Sentry
    console.error("No content in response", response);
    return null;
  }

  const parsed = schema.safeParse(JSON.parse(response.choices[0].message.content));

  if (!parsed.success) {
    // TODO: Log this to Sentry
    console.error("Invalid response", parsed.error);
    return null;
  }

  return parsed.data.title;
}
