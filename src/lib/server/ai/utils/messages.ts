import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";

export function getTextFromMessage(message: ChatCompletionMessageParam): string | null {
  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => ("text" in part ? part.text : "refusal" in part ? part.refusal : null))
      .filter((text) => text !== null)
      .join("");
  }

  return null;
}
