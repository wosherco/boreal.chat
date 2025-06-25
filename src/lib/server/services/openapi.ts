import { backOff } from "exponential-backoff";

export interface OpenRouterGeneration {
  id: string;
  total_cost: number;
  created_at: string;
  model: string;
  origin: string;
  usage: number;
  is_byok: boolean;
  upstream_id: string;
  cache_discount: number;
  app_id: number;
  streamed: boolean;
  cancelled: boolean;
  provider_name: string;
  latency: number;
  moderation_latency: number;
  generation_time: number;
  finish_reason: string;
  native_finish_reason: string;
  tokens_prompt: number;
  tokens_completion: number;
  native_tokens_prompt: number;
  native_tokens_completion: number;
  native_tokens_reasoning: number;
  num_media_prompt: number;
  num_media_completion: number;
  num_search_results: number;
}

interface OpenRouterGenerationAPIResponse {
  data: OpenRouterGeneration;
}

export async function getUsageData(
  apiKey: string,
  generationId: string,
): Promise<OpenRouterGeneration> {
  const url = new URL("https://openrouter.ai/api/v1/generation");
  url.searchParams.append("id", generationId);

  const response = await backOff(
    async () => {
      const response = await fetch(url.href, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Failed to fetch usage data: ${response.status} ${response.statusText} - ${errorBody}`,
        );
      }
      return response;
    },
    {
      numOfAttempts: 5,
    },
  );

  const result = (await response.json()) as OpenRouterGenerationAPIResponse;

  return result.data;
}
