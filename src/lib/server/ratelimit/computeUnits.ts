import type { ModelId } from "$lib/common/ai/models";
import { MODEL_FEATURES } from "$lib/common/ai/modelFeatures";

/**
 * Compute Units (CUs) calculation system
 * 
 * Base pricing reference:
 * - Input: $1/M tokens or less = 1CU, scaled proportionally above
 * - Output: $2.5/1M ±$1 tokens = 1CU, scaled proportionally
 */

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  model: ModelId;
}

export interface CUCalculationResult {
  inputCUs: number;
  outputCUs: number;
  totalCUs: number;
  inputCost: number; // USD
  outputCost: number; // USD
  totalCost: number; // USD
}

// Base pricing for 1 CU calculation
const BASE_INPUT_PRICE_PER_TOKEN = 0.000001; // $1/M tokens
const BASE_OUTPUT_PRICE_PER_TOKEN = 0.0000025; // $2.5/M tokens

/**
 * Calculate CUs based on token usage and model pricing
 */
export function calculateCUs(usage: TokenUsage): CUCalculationResult {
  const modelFeatures = MODEL_FEATURES[usage.model];
  
  if (!modelFeatures) {
    throw new Error(`Model features not found for model: ${usage.model}`);
  }

  // Get model pricing (per token)
  const inputPricePerToken = parseFloat(modelFeatures.pricing.prompt);
  const outputPricePerToken = parseFloat(modelFeatures.pricing.completion);

  // Calculate actual costs
  const inputCost = usage.inputTokens * inputPricePerToken;
  const outputCost = usage.outputTokens * outputPricePerToken;
  const totalCost = inputCost + outputCost;

  // Calculate CUs based on pricing relative to base rates
  const inputCUs = calculateInputCUs(usage.inputTokens, inputPricePerToken);
  const outputCUs = calculateOutputCUs(usage.outputTokens, outputPricePerToken);
  const totalCUs = inputCUs + outputCUs;

  return {
    inputCUs,
    outputCUs,
    totalCUs,
    inputCost,
    outputCost,
    totalCost,
  };
}

/**
 * Calculate input CUs
 * Base: $1/M tokens = 1CU per 1M tokens
 */
function calculateInputCUs(tokens: number, pricePerToken: number): number {
  if (tokens === 0) return 0;
  
  // Calculate CU multiplier based on how expensive this model is relative to base
  const priceRatio = pricePerToken / BASE_INPUT_PRICE_PER_TOKEN;
  
  // Round to common ratios (1, 1.25, 1.5, 1.75, 2, etc.)
  const roundedRatio = Math.ceil(priceRatio * 4) / 4;
  
  // Calculate CUs: (tokens / 1M) * price_multiplier
  return (tokens / 1_000_000) * roundedRatio;
}

/**
 * Calculate output CUs
 * Base: $2.5/M tokens = 1CU per 1M tokens
 */
function calculateOutputCUs(tokens: number, pricePerToken: number): number {
  if (tokens === 0) return 0;
  
  // Calculate CU multiplier based on how expensive this model is relative to base
  const priceRatio = pricePerToken / BASE_OUTPUT_PRICE_PER_TOKEN;
  
  // Round to common ratios (1, 1.25, 1.5, 1.75, 2, etc.)
  const roundedRatio = Math.ceil(priceRatio * 4) / 4;
  
  // Calculate CUs: (tokens / 1M) * price_multiplier
  return (tokens / 1_000_000) * roundedRatio;
}

/**
 * Estimate CUs for a request based on typical usage patterns
 * This is useful for rate limiting before actual token usage is known
 */
export function estimateCUsForRequest(
  model: ModelId,
  estimatedInputTokens: number = 1000, // Default estimate
  estimatedOutputTokens: number = 500   // Default estimate
): CUCalculationResult {
  return calculateCUs({
    inputTokens: estimatedInputTokens,
    outputTokens: estimatedOutputTokens,
    model,
  });
}

/**
 * Get CU rate for a specific model (CUs per 1K tokens, useful for rough estimates)
 */
export function getModelCURate(model: ModelId): { inputCUsPer1K: number; outputCUsPer1K: number } {
  const modelFeatures = MODEL_FEATURES[model];
  
  if (!modelFeatures) {
    throw new Error(`Model features not found for model: ${model}`);
  }

  const inputPricePerToken = parseFloat(modelFeatures.pricing.prompt);
  const outputPricePerToken = parseFloat(modelFeatures.pricing.completion);

  // Calculate CUs per 1K tokens
  const inputCUsPer1K = calculateInputCUs(1000, inputPricePerToken);
  const outputCUsPer1K = calculateOutputCUs(1000, outputPricePerToken);

  return {
    inputCUsPer1K,
    outputCUsPer1K,
  };
}

// TODO: Implement credits system integration
export interface UserCredits {
  balance: number;
  // TODO: Add subscription tier, usage limits, etc.
}

// TODO: Implement usage-based rate limiting
export function checkCreditBalance(userId: string, requiredCUs: number): Promise<boolean> {
  // TODO: Query user's credit balance from database
  // TODO: Check if user has enough credits for the request
  // TODO: Consider subscription tier and limits
  throw new Error("Credits system not yet implemented");
}

// TODO: Implement credit deduction
export function deductCredits(userId: string, usedCUs: number): Promise<void> {
  // TODO: Deduct CUs from user's credit balance
  // TODO: Log usage for billing/analytics
  throw new Error("Credits system not yet implemented");
}