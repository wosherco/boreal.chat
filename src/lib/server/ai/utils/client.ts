import { env } from "$env/dynamic/private";
import OpenAI from "openai";

export function createOpenAIClient(auth: string) {
  const openai = new OpenAI({
    apiKey: auth,
    baseURL: env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://boreal.chat",
      "X-Title": "boreal.chat",
    },
  });

  return openai;
}
