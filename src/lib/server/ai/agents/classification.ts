import { z } from "zod/v4";
import { createOpenAIClient } from "../utils/client";
import * as Sentry from "@sentry/sveltekit";
import classificationPrompt from "$lib/prompts/classification.md?raw";

export interface ClassifyMessageContext {
  userId: string;
}

const schema = z.object({
  category: z.enum([
    "Conversational",
    "Coding", 
    "Research",
    "Creative",
    "Analytical",
    "Personal Assistant"
  ]).describe("The primary category that best describes the user's message intent"),
});

export type MessageCategory = z.infer<typeof schema>["category"];

export async function classifyMessage(
  context: ClassifyMessageContext,
  userMessage: string,
  apiKey: string,
  model: string,
) {
  const response = await createOpenAIClient(apiKey).chat.completions.create({
    model: model,
    messages: [
      {
        role: "system",
        content: classificationPrompt,
      },
      {
        role: "user", 
        content: `Classify the following user message:\n\n${userMessage}`,
      },
    ],
    user: context.userId,
    response_format: {
      type: "json_schema",
      json_schema: { name: "classification", schema: z.toJSONSchema(schema), strict: true },
    },
    stream: false,
  });

  if (!response.choices[0].message.content) {
    Sentry.captureException(new Error("No content in classification response"), {
      user: { id: context.userId },
      extra: {
        userMessage,
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
        userMessage,
        rawResponse: response.choices[0].message.content,
      },
    });
    console.error("Invalid classification response", parsed.error);
    return null;
  }

  return parsed.data.category;
}