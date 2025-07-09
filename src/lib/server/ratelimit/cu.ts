import { MODEL_FEATURES } from "$lib/common/ai/modelFeatures";
import type { ModelId } from "$lib/common/ai/models";

const BASE_CU_TOKEN_COST = 2.5 / 1_000_000;

export function aproximateTokens(text: string) {
  const words = text.split(" ");
  return words.length * 4;
}

export interface CUResult {
  total: number;
  inputCUs: number;
  outputCUs: number;
}

export function calculateCUs(
  inputTokens: number,
  outputTokens: number,
  modelId: ModelId,
): CUResult {
  const modelFeatures = MODEL_FEATURES[modelId];

  const inputCUs = calculateModelCUs(
    inputTokens,
    modelFeatures?.pricing.completion ?? BASE_CU_TOKEN_COST,
  );
  const outputCUs = calculateModelCUs(
    outputTokens,
    modelFeatures?.pricing.completion ?? BASE_CU_TOKEN_COST,
  );

  return { total: inputCUs + outputCUs, inputCUs, outputCUs };
}

function calculateModelCUs(tokens: number, costPerToken: number) {
  return tokens * (costPerToken / BASE_CU_TOKEN_COST);
}
