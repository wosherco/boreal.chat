/**
 * Example demonstrations of the CU-based rate limiting system
 * This file shows how the system calculates CUs and applies rate limits
 */

import { calculateCUs, estimateCUsForRequest, getModelCURate } from "./computeUnits";
import { CLAUDE_SONNET_4, GPT_4O_MINI, DEEPSEEK_V3_FREE } from "$lib/common/ai/models";

/**
 * Example 1: Calculate CUs for different models with same token usage
 */
export function demonstrateCUCalculation() {
  const tokenUsage = {
    inputTokens: 1000,
    outputTokens: 500,
  };

  console.log("=== CU Calculation Examples ===");
  console.log(`Input: ${tokenUsage.inputTokens} tokens, Output: ${tokenUsage.outputTokens} tokens\n`);

  // Example with expensive model (Claude Sonnet 4)
  const claudeResult = calculateCUs({
    ...tokenUsage,
    model: CLAUDE_SONNET_4,
  });

  console.log("Claude Sonnet 4:");
  console.log(`  Input CUs: ${claudeResult.inputCUs.toFixed(4)}`);
  console.log(`  Output CUs: ${claudeResult.outputCUs.toFixed(4)}`);
  console.log(`  Total CUs: ${claudeResult.totalCUs.toFixed(4)}`);
  console.log(`  Total Cost: $${claudeResult.totalCost.toFixed(6)}\n`);

  // Example with cheap model (GPT-4o Mini)
  const gptMiniResult = calculateCUs({
    ...tokenUsage,
    model: GPT_4O_MINI,
  });

  console.log("GPT-4o Mini:");
  console.log(`  Input CUs: ${gptMiniResult.inputCUs.toFixed(4)}`);
  console.log(`  Output CUs: ${gptMiniResult.outputCUs.toFixed(4)}`);
  console.log(`  Total CUs: ${gptMiniResult.totalCUs.toFixed(4)}`);
  console.log(`  Total Cost: $${gptMiniResult.totalCost.toFixed(6)}\n`);

  // Example with free model (DeepSeek V3 Free)
  const deepseekFreeResult = calculateCUs({
    ...tokenUsage,
    model: DEEPSEEK_V3_FREE,
  });

  console.log("DeepSeek V3 Free:");
  console.log(`  Input CUs: ${deepseekFreeResult.inputCUs.toFixed(4)}`);
  console.log(`  Output CUs: ${deepseekFreeResult.outputCUs.toFixed(4)}`);
  console.log(`  Total CUs: ${deepseekFreeResult.totalCUs.toFixed(4)}`);
  console.log(`  Total Cost: $${deepseekFreeResult.totalCost.toFixed(6)}\n`);

  console.log("=== CU Ratios ===");
  console.log(`Claude vs GPT Mini ratio: ${(claudeResult.totalCUs / gptMiniResult.totalCUs).toFixed(2)}x`);
  console.log(`Claude vs DeepSeek Free ratio: ${claudeResult.totalCUs === 0 && deepseekFreeResult.totalCUs === 0 ? "N/A" : (claudeResult.totalCUs / Math.max(deepseekFreeResult.totalCUs, 0.0001)).toFixed(2)}x`);
}

/**
 * Example 2: Show rate limiting scenarios for different user tiers
 */
export function demonstrateRateLimitingScenarios() {
  console.log("\n=== Rate Limiting Scenarios ===");

  const scenarios = [
    {
      userTier: "free",
      cuLimit: 10, // 10 CUs per hour
      description: "Free tier user with 10 CU/hour limit",
    },
    {
      userTier: "premium",
      cuLimit: 100, // 100 CUs per hour
      description: "Premium tier user with 100 CU/hour limit",
    },
    {
      userTier: "unlimited",
      cuLimit: 1000, // 1000 CUs per hour
      description: "Unlimited tier user with 1000 CU/hour limit",
    },
  ];

  scenarios.forEach((scenario) => {
    console.log(`\n${scenario.description}:`);
    
    // Calculate how many requests they can make with different models
    const models = [
      { name: "GPT-4o Mini", id: GPT_4O_MINI },
      { name: "Claude Sonnet 4", id: CLAUDE_SONNET_4 },
      { name: "DeepSeek V3 Free", id: DEEPSEEK_V3_FREE },
    ];

    models.forEach((model) => {
      const estimatedCUs = estimateCUsForRequest(model.id, 1000, 500);
      const requestsPerHour = scenario.cuLimit / Math.max(estimatedCUs.totalCUs, 0.001);
      
      console.log(`  ${model.name}: ~${Math.floor(requestsPerHour)} requests/hour (${estimatedCUs.totalCUs.toFixed(4)} CUs each)`);
    });
  });
}

/**
 * Example 3: Show model CU rates for quick reference
 */
export function showModelCURates() {
  console.log("\n=== Model CU Rates (per 1K tokens) ===");

  const models = [
    { name: "GPT-4o Mini", id: GPT_4O_MINI },
    { name: "Claude Sonnet 4", id: CLAUDE_SONNET_4 },
    { name: "DeepSeek V3 Free", id: DEEPSEEK_V3_FREE },
  ];

  models.forEach((model) => {
    try {
      const rates = getModelCURate(model.id);
      console.log(`${model.name}:`);
      console.log(`  Input: ${rates.inputCUsPer1K.toFixed(6)} CUs/1K tokens`);
      console.log(`  Output: ${rates.outputCUsPer1K.toFixed(6)} CUs/1K tokens`);
    } catch (error) {
      console.log(`${model.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

/**
 * Example 4: Simulate rate limiting headers
 */
export function simulateRateLimitingHeaders() {
  console.log("\n=== Simulated Rate Limiting Headers ===");

  const mockRequest = {
    model: CLAUDE_SONNET_4,
    inputTokens: 2000,
    outputTokens: 1000,
    userTier: "premium" as const,
    currentCUUsage: 75, // User has already used 75 CUs this hour
    cuLimit: 100, // Premium limit
  };

  const estimatedCUs = estimateCUsForRequest(mockRequest.model, mockRequest.inputTokens, mockRequest.outputTokens);
  const cuCost = Math.ceil(estimatedCUs.totalCUs);
  const remaining = Math.max(0, mockRequest.cuLimit - mockRequest.currentCUUsage - cuCost);

  console.log("Example request headers:");
  console.log(`X-CU-Cost: ${cuCost}`);
  console.log(`X-CU-Remaining: ${remaining}`);
  console.log(`X-User-Tier: ${mockRequest.userTier}`);
  console.log(`X-RateLimit-CU-Limit: ${mockRequest.cuLimit}`);
  console.log(`X-Estimated-CU-Cost: ${estimatedCUs.totalCUs.toFixed(4)}`);

  if (remaining <= 0) {
    console.log("\n❌ Request would be BLOCKED (insufficient CUs)");
    console.log("Error: You have reached your Compute Unit limit. This request would cost " + 
                `${cuCost} CUs. Please try again later or upgrade your plan.`);
  } else {
    console.log("\n✅ Request would be ALLOWED");
  }
}

/**
 * Run all examples
 */
export function runAllExamples() {
  try {
    demonstrateCUCalculation();
    demonstrateRateLimitingScenarios();
    showModelCURates();
    simulateRateLimitingHeaders();
  } catch (error) {
    console.error("Error running examples:", error);
    console.log("\nNote: Some examples may fail due to missing model data or configuration.");
    console.log("This is expected in a development environment.");
  }
}

// Uncomment to run examples:
// runAllExamples();