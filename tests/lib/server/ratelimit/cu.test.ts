import { describe, it, expect, vi } from "vitest";
import { approximateTokens, calculateCUs } from "../../../../src/lib/server/ratelimit/cu";
import type { ModelId } from "../../../../src/lib/common/ai/models";

// Mock the model features
vi.mock("$lib/common/ai/modelFeatures", () => ({
  MODEL_FEATURES: {
    "openai/gpt-4o": {
      contextLength: 128000,
      pricing: {
        prompt: 0.000005,
        completion: 0.000015,
        image: 0.0015,
        web_search: 0,
        request: 0,
      },
      inputModalities: ["text", "image"],
    },
    "anthropic/claude-3.5-sonnet": {
      contextLength: 200000,
      pricing: {
        prompt: 0.000003,
        completion: 0.000015,
        image: 0.0048,
        web_search: 0,
        request: 0,
      },
      inputModalities: ["image", "text"],
    },
    "deepseek/deepseek-r1-0528:free": {
      contextLength: 163840,
      pricing: {
        prompt: 0,
        completion: 0,
        image: 0,
        web_search: 0,
        request: 0,
      },
      inputModalities: ["text"],
    },
    "expensive-model": {
      contextLength: 100000,
      pricing: {
        prompt: 0.0001,
        completion: 0.0002,
        image: 0,
        web_search: 0,
        request: 0,
      },
      inputModalities: ["text"],
    },
  } as const,
}));

const BASE_CU_TOKEN_COST = 2.5 / 1_000_000;

describe("cu.ts", () => {
  describe("approximateTokens", () => {
    it("should return 0 for empty string", () => {
      const result = approximateTokens("");
      expect(result).toBe(0);
    });

    it("should calculate tokens for single word", () => {
      const result = approximateTokens("hello");
      expect(result).toBe(4); // 1 word * 4
    });

    it("should calculate tokens for multiple words", () => {
      const result = approximateTokens("hello world test");
      expect(result).toBe(12); // 3 words * 4
    });

    it("should handle multiple spaces between words", () => {
      const result = approximateTokens("hello  world   test");
      expect(result).toBe(24); // 6 words (empty strings count) * 4
    });

    it("should handle leading and trailing spaces", () => {
      const result = approximateTokens(" hello world ");
      expect(result).toBe(16); // 4 words (including empty strings) * 4
    });

    it("should handle long text", () => {
      const longText = Array(100).fill("word").join(" ");
      const result = approximateTokens(longText);
      expect(result).toBe(400); // 100 words * 4
    });
  });

  describe("calculateCUs", () => {
    it("should calculate CUs for a known model with pricing", () => {
      const result = calculateCUs(1000, 500, "openai/gpt-4o" as ModelId);

      // Calculate expected values - both input and output use completion pricing
      // Input: 1000 tokens * (0.000015 / BASE_CU_TOKEN_COST)
      const expectedInputCUs = 1000 * (0.000015 / BASE_CU_TOKEN_COST);
      // Output: 500 tokens * (0.000015 / BASE_CU_TOKEN_COST)
      const expectedOutputCUs = 500 * (0.000015 / BASE_CU_TOKEN_COST);
      const expectedTotal = expectedInputCUs + expectedOutputCUs;

      expect(result.inputCUs).toBeCloseTo(expectedInputCUs, 6);
      expect(result.outputCUs).toBeCloseTo(expectedOutputCUs, 6);
      expect(result.total).toBeCloseTo(expectedTotal, 6);
    });

    it("should calculate CUs for Anthropic model", () => {
      const result = calculateCUs(2000, 1000, "anthropic/claude-3.5-sonnet" as ModelId);

      // Both input and output use completion pricing (0.000015)
      const expectedInputCUs = 2000 * (0.000015 / BASE_CU_TOKEN_COST);
      const expectedOutputCUs = 1000 * (0.000015 / BASE_CU_TOKEN_COST);
      const expectedTotal = expectedInputCUs + expectedOutputCUs;

      expect(result.inputCUs).toBeCloseTo(expectedInputCUs, 6);
      expect(result.outputCUs).toBeCloseTo(expectedOutputCUs, 6);
      expect(result.total).toBeCloseTo(expectedTotal, 6);
    });

    it("should handle free models with zero pricing", () => {
      const result = calculateCUs(1000, 500, "deepseek/deepseek-r1-0528:free" as ModelId);

      expect(result.inputCUs).toBe(0);
      expect(result.outputCUs).toBe(0);
      expect(result.total).toBe(0);
    });

    it("should use base cost for unknown model", () => {
      const result = calculateCUs(1000, 500, "unknown-model" as ModelId);

      const expectedInputCUs = 1000 * (BASE_CU_TOKEN_COST / BASE_CU_TOKEN_COST); // 1000 * 1
      const expectedOutputCUs = 500 * (BASE_CU_TOKEN_COST / BASE_CU_TOKEN_COST); // 500 * 1
      const expectedTotal = 1500;

      expect(result.inputCUs).toBe(expectedInputCUs);
      expect(result.outputCUs).toBe(expectedOutputCUs);
      expect(result.total).toBe(expectedTotal);
    });

    it("should handle zero input tokens", () => {
      const result = calculateCUs(0, 500, "openai/gpt-4o" as ModelId);

      expect(result.inputCUs).toBe(0);
      expect(result.outputCUs).toBeCloseTo(500 * (0.000015 / BASE_CU_TOKEN_COST), 6);
      expect(result.total).toBeCloseTo(500 * (0.000015 / BASE_CU_TOKEN_COST), 6);
    });

    it("should handle zero output tokens", () => {
      const result = calculateCUs(1000, 0, "openai/gpt-4o" as ModelId);

      expect(result.inputCUs).toBeCloseTo(1000 * (0.000015 / BASE_CU_TOKEN_COST), 6);
      expect(result.outputCUs).toBe(0);
      expect(result.total).toBeCloseTo(1000 * (0.000015 / BASE_CU_TOKEN_COST), 6);
    });

    it("should handle both input and output tokens being zero", () => {
      const result = calculateCUs(0, 0, "openai/gpt-4o" as ModelId);

      expect(result.inputCUs).toBe(0);
      expect(result.outputCUs).toBe(0);
      expect(result.total).toBe(0);
    });

    it("should return correct structure with all required fields", () => {
      const result = calculateCUs(100, 50, "openai/gpt-4o" as ModelId);

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("inputCUs");
      expect(result).toHaveProperty("outputCUs");
      expect(typeof result.total).toBe("number");
      expect(typeof result.inputCUs).toBe("number");
      expect(typeof result.outputCUs).toBe("number");
    });

    it("should calculate higher CUs for expensive models", () => {
      const cheapResult = calculateCUs(1000, 500, "deepseek/deepseek-r1-0528:free" as ModelId);
      const expensiveResult = calculateCUs(1000, 500, "expensive-model" as ModelId);

      expect(expensiveResult.total).toBeGreaterThan(cheapResult.total);
    });

    it("should be proportional to token count", () => {
      const smallResult = calculateCUs(100, 50, "openai/gpt-4o" as ModelId);
      const largeResult = calculateCUs(1000, 500, "openai/gpt-4o" as ModelId);

      // Large result should be exactly 10x the small result
      expect(largeResult.total).toBeCloseTo(smallResult.total * 10, 6);
      expect(largeResult.inputCUs).toBeCloseTo(smallResult.inputCUs * 10, 6);
      expect(largeResult.outputCUs).toBeCloseTo(smallResult.outputCUs * 10, 6);
    });

    it("should handle large token numbers", () => {
      const result = calculateCUs(1_000_000, 500_000, "openai/gpt-4o" as ModelId);

      expect(result.total).toBeGreaterThan(0);
      expect(result.inputCUs).toBeGreaterThan(0);
      expect(result.outputCUs).toBeGreaterThan(0);
      expect(result.total).toBe(result.inputCUs + result.outputCUs);
    });

    it("should use completion pricing for both input and output", () => {
      // This test verifies that both input and output use the completion pricing
      // rather than the prompt pricing, as seen in the original code
      const result = calculateCUs(1000, 1000, "openai/gpt-4o" as ModelId);

      // Both should use completion pricing (0.000015)
      const expectedCUsPerToken = 0.000015 / BASE_CU_TOKEN_COST;
      const expectedInputCUs = 1000 * expectedCUsPerToken;
      const expectedOutputCUs = 1000 * expectedCUsPerToken;

      expect(result.inputCUs).toBeCloseTo(expectedInputCUs, 6);
      expect(result.outputCUs).toBeCloseTo(expectedOutputCUs, 6);
      expect(result.inputCUs).toBeCloseTo(result.outputCUs, 6);
    });
  });

  describe("edge cases and integration", () => {
    it("should work correctly with approximateTokens output", () => {
      const text = "hello world test message";
      const approximatedTokens = approximateTokens(text);

      const result = calculateCUs(
        approximatedTokens,
        approximatedTokens,
        "openai/gpt-4o" as ModelId,
      );

      expect(result.total).toBeGreaterThan(0);
      expect(result.inputCUs).toEqual(result.outputCUs); // Same token count
    });

    it("should handle very small token counts", () => {
      const result = calculateCUs(1, 1, "openai/gpt-4o" as ModelId);

      expect(result.total).toBeGreaterThan(0);
      expect(result.inputCUs).toBeGreaterThan(0);
      expect(result.outputCUs).toBeGreaterThan(0);
    });

    it("should handle decimal token counts (even though tokens should be integers)", () => {
      const result = calculateCUs(100.5, 50.7, "openai/gpt-4o" as ModelId);

      expect(result.total).toBeGreaterThan(0);
      expect(typeof result.total).toBe("number");
      expect(Number.isFinite(result.total)).toBe(true);
    });
  });
});
