import { ORPCError } from "@orpc/client";
import { osBase } from "../orpc/context";
import { authenticatedMiddleware } from "../orpc/middlewares";
import { 
  getCURatelimiterForTier, 
  getChatRatelimiterForTier,
  isHighCostModel,
  isUltraHighCostModel,
  highCostModelRatelimiter,
  ultraHighCostModelRatelimiter
} from "./limiters";
import { estimateCUsForRequest, type TokenUsage } from "./computeUnits";
import type { ModelId } from "$lib/common/ai/models";

/**
 * Interface for CU-based rate limiting input
 */
interface CURatelimitInput {
  model: ModelId;
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
}

/**
 * Get user subscription tier
 * TODO: Implement proper subscription tier detection
 */
function getUserTier(user: any): "free" | "premium" | "unlimited" {
  // TODO: Implement proper subscription tier logic based on user.subscriptionPlan
  if (user.subscriptionPlan === "unlimited") return "unlimited";
  if (user.subscriptionPlan === "premium") return "premium";
  return "free";
}

/**
 * CU-based rate limiting middleware
 * This checks if the user has enough CU allowance for the estimated request
 */
export const cuRatelimitMiddleware = authenticatedMiddleware.concat(
  async ({ context, next }, input: CURatelimitInput) => {
    const userTier = getUserTier(context.userCtx.user);
    
    // Get appropriate rate limiters
    const cuRatelimiter = getCURatelimiterForTier(userTier);
    const chatRatelimiter = getChatRatelimiterForTier(userTier);

    // First check general chat rate limiting
    const chatResult = await chatRatelimiter.limit(context.userCtx.user.id);
    if (!chatResult.success) {
      context.headers.set("X-RateLimit-Chat-Limit", chatResult.limit.toString());
      context.headers.set("X-RateLimit-Chat-Remaining", chatResult.remaining.toString());
      context.headers.set("X-RateLimit-Chat-Reset", chatResult.reset.toString());

      throw new ORPCError("RATE_LIMIT_EXCEEDED", {
        message: "You have reached the chat request limit. Please try again later.",
      });
    }

    // Check model-specific rate limiting for expensive models
    if (isUltraHighCostModel(input.model)) {
      const ultraHighCostResult = await ultraHighCostModelRatelimiter.limit(context.userCtx.user.id);
      if (!ultraHighCostResult.success) {
        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: "You have reached the limit for ultra-high-cost models. Please try again later.",
        });
      }
    } else if (isHighCostModel(input.model)) {
      const highCostResult = await highCostModelRatelimiter.limit(context.userCtx.user.id);
      if (!highCostResult.success) {
        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: "You have reached the limit for high-cost models. Please try again later.",
        });
      }
    }

    // Estimate CUs for this request
    const estimatedCUs = estimateCUsForRequest(
      input.model,
      input.estimatedInputTokens,
      input.estimatedOutputTokens
    );

    // Convert total CUs to integer for rate limiting (round up to be conservative)
    const cuCost = Math.ceil(estimatedCUs.totalCUs);

    // Check CU-based rate limiting
    // For now, we'll do multiple calls to simulate CU consumption
    // TODO: Implement proper variable-cost rate limiting or use a different approach
    if (cuCost > 0) {
      // Make multiple calls to the rate limiter to "consume" CUs
      // This is a simple approach - in production you might want a more sophisticated system
      let remainingCUs = cuCost;
      let lastResult;
      
      while (remainingCUs > 0) {
        const consumeAmount = Math.min(remainingCUs, 1); // Consume 1 CU at a time
        lastResult = await cuRatelimiter.limit(context.userCtx.user.id);
        
        if (!lastResult.success) {
          context.headers.set("X-RateLimit-CU-Limit", lastResult.limit.toString());
          context.headers.set("X-RateLimit-CU-Remaining", lastResult.remaining.toString());
          context.headers.set("X-RateLimit-CU-Reset", lastResult.reset.toString());
          context.headers.set("X-RateLimit-CU-Cost", cuCost.toString());

          throw new ORPCError("RATE_LIMIT_EXCEEDED", {
            message: `You have reached your Compute Unit limit. This request would cost ${cuCost} CUs. Please try again later or upgrade your plan.`,
          });
        }
        
        remainingCUs -= consumeAmount;
      }

      // Set informational headers about CU usage
      if (lastResult) {
        context.headers.set("X-CU-Cost", cuCost.toString());
        context.headers.set("X-CU-Remaining", lastResult.remaining.toString());
        context.headers.set("X-User-Tier", userTier);
      }
    }

    // TODO: Check credit balance before proceeding
    // TODO: Reserve credits for this request
    
    return next({
      context: {
        ...context,
        cuInfo: {
          estimatedCUs: estimatedCUs.totalCUs,
          userTier,
          cuCost,
        },
      },
    });
  }
);

/**
 * Post-processing middleware to track actual CU usage
 * This should be called after the request is complete with actual token usage
 */
export function trackActualCUUsage(usage: TokenUsage, userId: string) {
  // TODO: Calculate actual CUs used
  // TODO: Deduct from user's credit balance
  // TODO: Log usage for analytics and billing
  
  console.log(`CU Usage Tracking - User: ${userId}, Model: ${usage.model}, Input: ${usage.inputTokens}, Output: ${usage.outputTokens}`);
  
  // This would be called asynchronously after the response is sent
  return Promise.resolve();
}

/**
 * Example unlimited middleware that bypasses all rate limiting
 * This demonstrates the system in action by showing what gets bypassed
 */
export const unlimitedMiddleware = authenticatedMiddleware.concat(
  async ({ context, next }, input: CURatelimitInput) => {
    const userTier = getUserTier(context.userCtx.user);
    
    // Log what would have been checked
    console.log("🚀 Unlimited Middleware - Bypassing rate limits:");
    console.log(`  User: ${context.userCtx.user.id} (${userTier})`);
    console.log(`  Model: ${input.model}`);
    
    // Show what rate limiters would normally be applied
    const cuRatelimiter = getCURatelimiterForTier(userTier);
    const chatRatelimiter = getChatRatelimiterForTier(userTier);
    
    console.log(`  Would use CU limiter: ${cuRatelimiter._ratelimiter ? 'enabled' : 'disabled'}`);
    console.log(`  Would use Chat limiter: ${chatRatelimiter._ratelimiter ? 'enabled' : 'disabled'}`);
    
    if (isUltraHighCostModel(input.model)) {
      console.log(`  Would check ultra-high-cost model limits`);
    } else if (isHighCostModel(input.model)) {
      console.log(`  Would check high-cost model limits`);
    }

    // Estimate what the CU cost would be
    const estimatedCUs = estimateCUsForRequest(
      input.model,
      input.estimatedInputTokens,
      input.estimatedOutputTokens
    );
    
    console.log(`  Estimated CU cost: ${estimatedCUs.totalCUs.toFixed(4)}`);
    console.log(`  Estimated USD cost: $${estimatedCUs.totalCost.toFixed(6)}`);
    console.log("  ✅ All limits bypassed for unlimited access");

    // Set informational headers
    context.headers.set("X-Unlimited-Access", "true");
    context.headers.set("X-Estimated-CU-Cost", estimatedCUs.totalCUs.toString());
    context.headers.set("X-User-Tier", userTier);

    return next({
      context: {
        ...context,
        cuInfo: {
          estimatedCUs: estimatedCUs.totalCUs,
          userTier,
          cuCost: 0, // No cost for unlimited users
          unlimited: true,
        },
      },
    });
  }
);

/**
 * Helper to create a model-specific CU middleware
 * This can be used for routes that know the model in advance
 */
export const createModelSpecificCUMiddleware = (
  model: ModelId,
  estimatedInputTokens?: number,
  estimatedOutputTokens?: number
) => {
  return authenticatedMiddleware.concat(async ({ context, next }) => {
    const userTier = getUserTier(context.userCtx.user);
    
    // Get appropriate rate limiters
    const cuRatelimiter = getCURatelimiterForTier(userTier);
    const chatRatelimiter = getChatRatelimiterForTier(userTier);

    // First check general chat rate limiting
    const chatResult = await chatRatelimiter.limit(context.userCtx.user.id);
    if (!chatResult.success) {
      context.headers.set("X-RateLimit-Chat-Limit", chatResult.limit.toString());
      context.headers.set("X-RateLimit-Chat-Remaining", chatResult.remaining.toString());
      context.headers.set("X-RateLimit-Chat-Reset", chatResult.reset.toString());

      throw new ORPCError("RATE_LIMIT_EXCEEDED", {
        message: "You have reached the chat request limit. Please try again later.",
      });
    }

    // Check model-specific rate limiting for expensive models
    if (isUltraHighCostModel(model)) {
      const ultraHighCostResult = await ultraHighCostModelRatelimiter.limit(context.userCtx.user.id);
      if (!ultraHighCostResult.success) {
        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: "You have reached the limit for ultra-high-cost models. Please try again later.",
        });
      }
    } else if (isHighCostModel(model)) {
      const highCostResult = await highCostModelRatelimiter.limit(context.userCtx.user.id);
      if (!highCostResult.success) {
        throw new ORPCError("RATE_LIMIT_EXCEEDED", {
          message: "You have reached the limit for high-cost models. Please try again later.",
        });
      }
    }

    // Estimate CUs for this request
    const estimatedCUs = estimateCUsForRequest(
      model,
      estimatedInputTokens,
      estimatedOutputTokens
    );

    // Convert total CUs to integer for rate limiting (round up to be conservative)
    const cuCost = Math.ceil(estimatedCUs.totalCUs);

    // Check CU-based rate limiting
    if (cuCost > 0) {
      let remainingCUs = cuCost;
      let lastResult;
      
      while (remainingCUs > 0) {
        const consumeAmount = Math.min(remainingCUs, 1);
        lastResult = await cuRatelimiter.limit(context.userCtx.user.id);
        
        if (!lastResult.success) {
          context.headers.set("X-RateLimit-CU-Limit", lastResult.limit.toString());
          context.headers.set("X-RateLimit-CU-Remaining", lastResult.remaining.toString());
          context.headers.set("X-RateLimit-CU-Reset", lastResult.reset.toString());
          context.headers.set("X-RateLimit-CU-Cost", cuCost.toString());

          throw new ORPCError("RATE_LIMIT_EXCEEDED", {
            message: `You have reached your Compute Unit limit. This request would cost ${cuCost} CUs. Please try again later or upgrade your plan.`,
          });
        }
        
        remainingCUs -= consumeAmount;
      }

      // Set informational headers about CU usage
      if (lastResult) {
        context.headers.set("X-CU-Cost", cuCost.toString());
        context.headers.set("X-CU-Remaining", lastResult.remaining.toString());
        context.headers.set("X-User-Tier", userTier);
      }
    }

    return next({
      context: {
        ...context,
        cuInfo: {
          estimatedCUs: estimatedCUs.totalCUs,
          userTier,
          cuCost,
        },
      },
    });
  });
};