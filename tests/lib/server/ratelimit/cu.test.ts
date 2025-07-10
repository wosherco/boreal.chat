import { describe, it, expect, vi } from "vitest";
import { approximateTokens, calculateCUs } from "../../../../src/lib/server/ratelimit/cu";
import type { ModelId } from "../../../../src/lib/common/ai/models";

// Mock the model features with fake model IDs and prices
vi.mock("$lib/common/ai/modelFeatures", () => {
  const TEST_MODELS = {
    BASIC: "test/basic-model",
    EXPENSIVE: "test/expensive-model",
    FREE: "test/free-model",
    DIFFERENT_PRICING: "test/different-pricing",
  } as const;

  return {
    MODEL_FEATURES: {
      [TEST_MODELS.BASIC]: {
        contextLength: 128000,
        pricing: {
          prompt: 0.000001, // $0.001 per 1K tokens
          completion: 0.000002, // $0.002 per 1K tokens
          image: 0.001,
          web_search: 0,
          request: 0,
        },
        inputModalities: ["text"],
      },
      [TEST_MODELS.EXPENSIVE]: {
        contextLength: 100000,
        pricing: {
          prompt: 0.00001, // $0.01 per 1K tokens
          completion: 0.00002, // $0.02 per 1K tokens
          image: 0,
          web_search: 0,
          request: 0,
        },
        inputModalities: ["text"],
      },
      [TEST_MODELS.FREE]: {
        contextLength: 64000,
        pricing: {
          prompt: 0,
          completion: 0,
          image: 0,
          web_search: 0,
          request: 0,
        },
        inputModalities: ["text"],
      },
      [TEST_MODELS.DIFFERENT_PRICING]: {
        contextLength: 200000,
        pricing: {
          prompt: 0.000003, // $0.003 per 1K tokens
          completion: 0.000015, // $0.015 per 1K tokens
          image: 0.0048,
          web_search: 0,
          request: 0,
        },
        inputModalities: ["text"],
      },
    } as const,
  };
});

// Test model IDs - these need to match the ones in the mock
const TEST_MODELS = {
  BASIC: "test/basic-model",
  EXPENSIVE: "test/expensive-model",
  FREE: "test/free-model",
  DIFFERENT_PRICING: "test/different-pricing",
  UNKNOWN: "unknown-model",
} as const;

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
    it("should calculate CUs for a basic test model", () => {
      const result = calculateCUs(1000, 500, TEST_MODELS.BASIC as ModelId);

      // Input tokens use prompt pricing: 1000 * (0.000001 / BASE_CU_TOKEN_COST)
      const expectedInputCUs = 1000 * (0.000001 / BASE_CU_TOKEN_COST);
      // Output tokens use completion pricing: 500 * (0.000002 / BASE_CU_TOKEN_COST)
      const expectedOutputCUs = 500 * (0.000002 / BASE_CU_TOKEN_COST);
      const expectedTotal = expectedInputCUs + expectedOutputCUs;

      expect(result.inputCUs).toBeCloseTo(expectedInputCUs, 6);
      expect(result.outputCUs).toBeCloseTo(expectedOutputCUs, 6);
      expect(result.total).toBeCloseTo(expectedTotal, 6);
    });

    it("should calculate CUs for model with different pricing", () => {
      const result = calculateCUs(2000, 1000, TEST_MODELS.DIFFERENT_PRICING as ModelId);

      // Input uses prompt pricing (0.000003), output uses completion pricing (0.000015)
      const expectedInputCUs = 2000 * (0.000003 / BASE_CU_TOKEN_COST);
      const expectedOutputCUs = 1000 * (0.000015 / BASE_CU_TOKEN_COST);
      const expectedTotal = expectedInputCUs + expectedOutputCUs;

      expect(result.inputCUs).toBeCloseTo(expectedInputCUs, 6);
      expect(result.outputCUs).toBeCloseTo(expectedOutputCUs, 6);
      expect(result.total).toBeCloseTo(expectedTotal, 6);
    });

    it("should handle free models with zero pricing", () => {
      const result = calculateCUs(1000, 500, TEST_MODELS.FREE as ModelId);

      expect(result.inputCUs).toBe(0);
      expect(result.outputCUs).toBe(0);
      expect(result.total).toBe(0);
    });

    it("should use base cost for unknown model", () => {
      const result = calculateCUs(1000, 500, TEST_MODELS.UNKNOWN as ModelId);

      const expectedInputCUs = 1000 * (BASE_CU_TOKEN_COST / BASE_CU_TOKEN_COST); // 1000 * 1
      const expectedOutputCUs = 500 * (BASE_CU_TOKEN_COST / BASE_CU_TOKEN_COST); // 500 * 1
      const expectedTotal = 1500;

      expect(result.inputCUs).toBe(expectedInputCUs);
      expect(result.outputCUs).toBe(expectedOutputCUs);
      expect(result.total).toBe(expectedTotal);
    });

    it("should handle zero input tokens", () => {
      const result = calculateCUs(0, 500, TEST_MODELS.BASIC as ModelId);

      expect(result.inputCUs).toBe(0);
      expect(result.outputCUs).toBeCloseTo(500 * (0.000002 / BASE_CU_TOKEN_COST), 6);
      expect(result.total).toBeCloseTo(500 * (0.000002 / BASE_CU_TOKEN_COST), 6);
    });

    it("should handle zero output tokens", () => {
      const result = calculateCUs(1000, 0, TEST_MODELS.BASIC as ModelId);

      expect(result.inputCUs).toBeCloseTo(1000 * (0.000001 / BASE_CU_TOKEN_COST), 6);
      expect(result.outputCUs).toBe(0);
      expect(result.total).toBeCloseTo(1000 * (0.000001 / BASE_CU_TOKEN_COST), 6);
    });

    it("should handle both input and output tokens being zero", () => {
      const result = calculateCUs(0, 0, TEST_MODELS.BASIC as ModelId);

      expect(result.inputCUs).toBe(0);
      expect(result.outputCUs).toBe(0);
      expect(result.total).toBe(0);
    });

    it("should return correct structure with all required fields", () => {
      const result = calculateCUs(100, 50, TEST_MODELS.BASIC as ModelId);

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("inputCUs");
      expect(result).toHaveProperty("outputCUs");
      expect(typeof result.total).toBe("number");
      expect(typeof result.inputCUs).toBe("number");
      expect(typeof result.outputCUs).toBe("number");
    });

    it("should calculate higher CUs for expensive models", () => {
      const cheapResult = calculateCUs(1000, 500, TEST_MODELS.FREE as ModelId);
      const expensiveResult = calculateCUs(1000, 500, TEST_MODELS.EXPENSIVE as ModelId);

      expect(expensiveResult.total).toBeGreaterThan(cheapResult.total);
    });

    it("should be proportional to token count", () => {
      const smallResult = calculateCUs(100, 50, TEST_MODELS.BASIC as ModelId);
      const largeResult = calculateCUs(1000, 500, TEST_MODELS.BASIC as ModelId);

      // Large result should be exactly 10x the small result
      expect(largeResult.total).toBeCloseTo(smallResult.total * 10, 6);
      expect(largeResult.inputCUs).toBeCloseTo(smallResult.inputCUs * 10, 6);
      expect(largeResult.outputCUs).toBeCloseTo(smallResult.outputCUs * 10, 6);
    });

    it("should handle large token numbers", () => {
      const result = calculateCUs(1_000_000, 500_000, TEST_MODELS.BASIC as ModelId);

      expect(result.total).toBeGreaterThan(0);
      expect(result.inputCUs).toBeGreaterThan(0);
      expect(result.outputCUs).toBeGreaterThan(0);
      expect(result.total).toBe(result.inputCUs + result.outputCUs);
    });

    it("should use different pricing for input and output", () => {
      // This test verifies that input uses prompt pricing and output uses completion pricing
      const result = calculateCUs(1000, 1000, TEST_MODELS.BASIC as ModelId);

      // Input should use prompt pricing (0.000001)
      const expectedInputCUs = 1000 * (0.000001 / BASE_CU_TOKEN_COST);
      // Output should use completion pricing (0.000002)
      const expectedOutputCUs = 1000 * (0.000002 / BASE_CU_TOKEN_COST);

      expect(result.inputCUs).toBeCloseTo(expectedInputCUs, 6);
      expect(result.outputCUs).toBeCloseTo(expectedOutputCUs, 6);
      expect(result.outputCUs).toBeCloseTo(result.inputCUs * 2, 6); // completion is 2x prompt price
    });
  });

  describe("edge cases and integration", () => {
    it("should work correctly with approximateTokens output", () => {
      const text = "hello world test message";
      const approximatedTokens = approximateTokens(text);

      const result = calculateCUs(
        approximatedTokens,
        approximatedTokens,
        TEST_MODELS.BASIC as ModelId,
      );

      expect(result.total).toBeGreaterThan(0);
      // Input and output should be different because they use different pricing
      expect(result.inputCUs).not.toEqual(result.outputCUs);
      expect(result.outputCUs).toBeCloseTo(result.inputCUs * 2, 6); // completion is 2x prompt
    });

    it("should handle very small token counts", () => {
      const result = calculateCUs(1, 1, TEST_MODELS.BASIC as ModelId);

      expect(result.total).toBeGreaterThan(0);
      expect(result.inputCUs).toBeGreaterThan(0);
      expect(result.outputCUs).toBeGreaterThan(0);
    });

    it("should handle decimal token counts (even though tokens should be integers)", () => {
      const result = calculateCUs(100.5, 50.7, TEST_MODELS.BASIC as ModelId);

      expect(result.total).toBeGreaterThan(0);
      expect(typeof result.total).toBe("number");
      expect(Number.isFinite(result.total)).toBe(true);
    });
  });
});
