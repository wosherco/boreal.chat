import { createRatelimit, Ratelimit } from "./client";

export const transcribeRatelimiter = createRatelimit(
  "transcribe",
  Ratelimit.slidingWindow(10, "10m"),
);

/**
 * CU-based rate limiters for different subscription tiers
 * These limit based on Compute Units (CUs) consumed
 */

// Free tier: 10 CUs per hour (roughly 10M tokens of cheap models)
export const freeTierCURatelimiter = createRatelimit(
  "cu_free_tier",
  Ratelimit.slidingWindow(10, "1h"),
);

// Premium tier: 100 CUs per hour (roughly 100M tokens of cheap models)
export const premiumTierCURatelimiter = createRatelimit(
  "cu_premium_tier", 
  Ratelimit.slidingWindow(100, "1h"),
);

// Unlimited tier: 1000 CUs per hour (roughly 1B tokens of cheap models)
export const unlimitedTierCURatelimiter = createRatelimit(
  "cu_unlimited_tier",
  Ratelimit.slidingWindow(1000, "1h"),
);

/**
 * Model-specific rate limiters for high-cost models
 * These are additional safeguards for expensive models
 */

// High-cost models (like Claude Opus): 5 requests per 10 minutes
export const highCostModelRatelimiter = createRatelimit(
  "high_cost_model",
  Ratelimit.slidingWindow(5, "10m"),
);

// Ultra-high-cost models (future models): 2 requests per 10 minutes  
export const ultraHighCostModelRatelimiter = createRatelimit(
  "ultra_high_cost_model",
  Ratelimit.slidingWindow(2, "10m"),
);

/**
 * General chat rate limiters (requests per time period)
 */

// Chat requests: 30 requests per 10 minutes for free users
export const freeChatRatelimiter = createRatelimit(
  "chat_free",
  Ratelimit.slidingWindow(30, "10m"),
);

// Chat requests: 100 requests per 10 minutes for premium users
export const premiumChatRatelimiter = createRatelimit(
  "chat_premium", 
  Ratelimit.slidingWindow(100, "10m"),
);

// Chat requests: 500 requests per 10 minutes for unlimited users
export const unlimitedChatRatelimiter = createRatelimit(
  "chat_unlimited",
  Ratelimit.slidingWindow(500, "10m"),
);

/**
 * Helper function to get appropriate CU rate limiter based on user tier
 */
export function getCURatelimiterForTier(tier: "free" | "premium" | "unlimited") {
  switch (tier) {
    case "free":
      return freeTierCURatelimiter;
    case "premium":
      return premiumTierCURatelimiter;
    case "unlimited":
      return unlimitedTierCURatelimiter;
    default:
      return freeTierCURatelimiter;
  }
}

/**
 * Helper function to get appropriate chat rate limiter based on user tier
 */
export function getChatRatelimiterForTier(tier: "free" | "premium" | "unlimited") {
  switch (tier) {
    case "free":
      return freeChatRatelimiter;
    case "premium":
      return premiumChatRatelimiter;
    case "unlimited":
      return unlimitedChatRatelimiter;
    default:
      return freeChatRatelimiter;
  }
}

/**
 * Helper function to determine if a model requires high-cost rate limiting
 * TODO: Move this to model configuration or pricing-based detection
 */
export function isHighCostModel(model: string): boolean {
  const highCostModels = [
    "anthropic/claude-opus-4",
    "anthropic/claude-sonnet-4", 
    "openai/gpt-4.1",
    "openai/o4-mini-high",
  ];
  return highCostModels.includes(model);
}

/**
 * Helper function to determine if a model requires ultra-high-cost rate limiting
 * TODO: Expand this based on future model pricing
 */
export function isUltraHighCostModel(model: string): boolean {
  // Currently no models require this, but prepared for future expensive models
  const ultraHighCostModels: string[] = [
    // TODO: Add future ultra-expensive models here
  ];
  return ultraHighCostModels.includes(model);
}
