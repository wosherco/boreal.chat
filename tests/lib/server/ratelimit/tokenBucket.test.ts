import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useRedisContainer } from "../../../__utils__/containers";
import { TokenBucketRateLimiter } from "../../../../src/lib/server/ratelimit/tokenBucket";

describe("TokenBucketRateLimiter", () => {
  const getRedisContainer = useRedisContainer();

  let rateLimiter: TokenBucketRateLimiter;
  let redisUri: string;

  beforeEach(() => {
    const container = getRedisContainer();
    redisUri = container?.getConnectionUrl() ?? "";

    // Set up a basic rate limiter for most tests
    rateLimiter = new TokenBucketRateLimiter(
      redisUri,
      10, // capacity
      5, // refillAmount
      60, // refillInterval (60 seconds)
    );

    // Mock environment variable to enable rate limiting
    vi.stubEnv("RATE_LIMIT_ENABLED", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Constructor", () => {
    it("should create a rate limiter with valid parameters", () => {
      const limiter = new TokenBucketRateLimiter(redisUri, 10, 5, 60);
      expect(limiter.getCapacity()).toBe(10);
    });

    it("should throw error for zero capacity", () => {
      expect(() => {
        new TokenBucketRateLimiter(redisUri, 0, 5, 60);
      }).toThrow("Capacity, refill amount, and interval must be positive values.");
    });

    it("should throw error for negative capacity", () => {
      expect(() => {
        new TokenBucketRateLimiter(redisUri, -1, 5, 60);
      }).toThrow("Capacity, refill amount, and interval must be positive values.");
    });

    it("should throw error for zero refill amount", () => {
      expect(() => {
        new TokenBucketRateLimiter(redisUri, 10, 0, 60);
      }).toThrow("Capacity, refill amount, and interval must be positive values.");
    });

    it("should throw error for negative refill amount", () => {
      expect(() => {
        new TokenBucketRateLimiter(redisUri, 10, -1, 60);
      }).toThrow("Capacity, refill amount, and interval must be positive values.");
    });

    it("should throw error for zero refill interval", () => {
      expect(() => {
        new TokenBucketRateLimiter(redisUri, 10, 5, 0);
      }).toThrow("Capacity, refill amount, and interval must be positive values.");
    });

    it("should throw error for negative refill interval", () => {
      expect(() => {
        new TokenBucketRateLimiter(redisUri, 10, 5, -1);
      }).toThrow("Capacity, refill amount, and interval must be positive values.");
    });
  });

  describe("consume()", () => {
    it("should consume tokens successfully when available", async () => {
      const result = await rateLimiter.consume("test-key-1", 3);

      expect(result.success).toBe(true);
      expect(result.remainingTokens).toBe(7); // 10 - 3 = 7
      expect(result.nextRefillAt).toBeGreaterThan(Date.now() / 1000);
    });

    it("should consume single token by default", async () => {
      const result = await rateLimiter.consume("test-key-2");

      expect(result.success).toBe(true);
      expect(result.remainingTokens).toBe(9); // 10 - 1 = 9
    });

    it("should fail when not enough tokens available", async () => {
      // First, consume most tokens
      await rateLimiter.consume("test-key-3", 8);

      // Try to consume more than remaining
      const result = await rateLimiter.consume("test-key-3", 5);

      expect(result.success).toBe(false);
      expect(result.remainingTokens).toBe(2); // Should show current tokens
    });

    it("should consume all remaining tokens", async () => {
      // First, consume some tokens
      await rateLimiter.consume("test-key-4", 3);

      // Consume all remaining tokens
      const result = await rateLimiter.consume("test-key-4", 7);

      expect(result.success).toBe(true);
      expect(result.remainingTokens).toBe(0);
    });

    it("should handle zero token consumption", async () => {
      const result = await rateLimiter.consume("test-key-5", 0);

      expect(result.success).toBe(true);
      expect(result.remainingTokens).toBe(10); // No tokens consumed
    });

    it("should handle multiple buckets independently", async () => {
      const result1 = await rateLimiter.consume("user-1", 5);
      const result2 = await rateLimiter.consume("user-2", 3);

      expect(result1.success).toBe(true);
      expect(result1.remainingTokens).toBe(5);

      expect(result2.success).toBe(true);
      expect(result2.remainingTokens).toBe(7);
    });
  });

  describe("Token refill behavior", () => {
    it("should refill tokens over time", async () => {
      // Create a limiter with short refill interval for testing
      const fastRefillLimiter = new TokenBucketRateLimiter(
        redisUri,
        10, // capacity
        3, // refillAmount
        1, // refillInterval (1 second)
      );

      // Consume most tokens
      await fastRefillLimiter.consume("refill-test-1", 8);

      // Mock time progression
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 1500); // 1.5 seconds later

      try {
        const result = await fastRefillLimiter.consume("refill-test-1", 1);

        expect(result.success).toBe(true);
        // Should have 2 + 3 (refill) - 1 (consumed) = 4 remaining
        expect(result.remainingTokens).toBe(4);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it("should handle multiple refills when enough time has passed", async () => {
      const fastRefillLimiter = new TokenBucketRateLimiter(
        redisUri,
        10, // capacity
        2, // refillAmount
        1, // refillInterval (1 second)
      );

      // Consume all tokens
      await fastRefillLimiter.consume("refill-test-2", 10);

      // Mock time progression - 3 seconds later
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 3000);

      try {
        const result = await fastRefillLimiter.consume("refill-test-2", 1);

        expect(result.success).toBe(true);
        // Should have 0 + (3 refills × 2 tokens) - 1 consumed = 5 remaining
        expect(result.remainingTokens).toBe(5);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it("should not exceed capacity when refilling", async () => {
      const fastRefillLimiter = new TokenBucketRateLimiter(
        redisUri,
        5, // small capacity
        10, // large refillAmount
        1, // refillInterval (1 second)
      );

      // Start with a fresh bucket (capacity tokens available)
      // Mock time progression
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 2000); // 2 seconds later

      try {
        const result = await fastRefillLimiter.consume("refill-test-3", 1);

        expect(result.success).toBe(true);
        // Should not exceed capacity of 5, so 5 - 1 = 4 remaining
        expect(result.remainingTokens).toBe(4);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it("should calculate correct nextRefillAt", async () => {
      const now = Date.now() / 1000;
      const result = await rateLimiter.consume("time-test", 1);

      expect(result.nextRefillAt).toBeGreaterThan(now);
      expect(result.nextRefillAt).toBeLessThan(now + 120); // Should be within reasonable range
    });
  });

  describe("addTokens()", () => {
    it("should add tokens to the bucket", async () => {
      // First consume some tokens
      await rateLimiter.consume("add-test-1", 5);

      // Add tokens back
      await rateLimiter.addTokens("add-test-1", 3);

      // Check the result
      const result = await rateLimiter.consume("add-test-1", 8);
      expect(result.success).toBe(true);
      expect(result.remainingTokens).toBe(0); // (10-5+3-8) = 0
    });

    it("should not exceed capacity when adding tokens", async () => {
      // Start with full bucket, add more tokens
      await rateLimiter.addTokens("add-test-2", 5);

      // Try to consume more than original capacity
      const result = await rateLimiter.consume("add-test-2", 11);
      expect(result.success).toBe(false);
      expect(result.remainingTokens).toBe(10); // Should be capped at capacity
    });

    it("should handle adding zero tokens", async () => {
      await rateLimiter.consume("add-test-3", 3);
      await rateLimiter.addTokens("add-test-3", 0);

      const result = await rateLimiter.consume("add-test-3", 8);
      expect(result.success).toBe(false);
      expect(result.remainingTokens).toBe(7); // 10 - 3 = 7, no change
    });

    it("should handle adding negative tokens", async () => {
      await rateLimiter.consume("add-test-4", 3);
      await rateLimiter.addTokens("add-test-4", -2);

      const result = await rateLimiter.consume("add-test-4", 8);
      expect(result.success).toBe(false);
      expect(result.remainingTokens).toBe(7); // Should ignore negative addition
    });
  });

  describe("removeTokens()", () => {
    it("should remove tokens from the bucket", async () => {
      // Remove tokens
      await rateLimiter.removeTokens("remove-test-1", 3);

      // Check the result
      const result = await rateLimiter.consume("remove-test-1", 8);
      expect(result.success).toBe(false);
      expect(result.remainingTokens).toBe(7); // 10 - 3 = 7
    });

    it("should not go below zero when removing tokens", async () => {
      // Remove more tokens than available
      await rateLimiter.removeTokens("remove-test-2", 15);

      const result = await rateLimiter.consume("remove-test-2", 1);
      expect(result.success).toBe(false);
      expect(result.remainingTokens).toBe(0); // Should be floored at 0
    });

    it("should handle removing zero tokens", async () => {
      await rateLimiter.removeTokens("remove-test-3", 0);

      const result = await rateLimiter.consume("remove-test-3", 10);
      expect(result.success).toBe(true);
      expect(result.remainingTokens).toBe(0); // All 10 tokens should be available
    });

    it("should handle removing negative tokens", async () => {
      await rateLimiter.removeTokens("remove-test-4", -5);

      const result = await rateLimiter.consume("remove-test-4", 10);
      expect(result.success).toBe(true);
      expect(result.remainingTokens).toBe(0); // Should ignore negative removal
    });
  });

  describe("getRemainingTokens()", () => {
    it("should return full capacity for new bucket", async () => {
      const result = await rateLimiter.getRemainingTokens("new-bucket");

      expect(result.remainingTokens).toBe(10);
      expect(result.nextRefillAt).toBeGreaterThan(Date.now() / 1000);
    });

    it("should return correct count after token consumption", async () => {
      // Consume some tokens
      await rateLimiter.consume("count-test-1", 3);

      // Check remaining tokens
      const result = await rateLimiter.getRemainingTokens("count-test-1");

      expect(result.remainingTokens).toBe(7);
      expect(result.nextRefillAt).toBeGreaterThan(Date.now() / 1000);
    });

    it("should not consume tokens when checking count", async () => {
      // Check tokens multiple times
      const result1 = await rateLimiter.getRemainingTokens("count-test-2");
      const result2 = await rateLimiter.getRemainingTokens("count-test-2");
      const result3 = await rateLimiter.getRemainingTokens("count-test-2");

      expect(result1.remainingTokens).toBe(10);
      expect(result2.remainingTokens).toBe(10);
      expect(result3.remainingTokens).toBe(10);
    });

    it("should reflect token refills over time", async () => {
      const fastRefillLimiter = new TokenBucketRateLimiter(
        redisUri,
        10, // capacity
        2, // refillAmount
        1, // refillInterval (1 second)
      );

      // Consume tokens
      await fastRefillLimiter.consume("refill-count-test", 8);

      // Check initial count
      const initialResult = await fastRefillLimiter.getRemainingTokens("refill-count-test");
      expect(initialResult.remainingTokens).toBe(2);

      // Mock time progression
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 2500); // 2.5 seconds later

      try {
        // Check count after refill time
        const refillResult = await fastRefillLimiter.getRemainingTokens("refill-count-test");

        // Should have 2 + (2 refills × 2 tokens) = 6 tokens
        expect(refillResult.remainingTokens).toBe(6);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it("should not exceed capacity even with multiple refills", async () => {
      const fastRefillLimiter = new TokenBucketRateLimiter(
        redisUri,
        5, // small capacity
        10, // large refillAmount
        1, // refillInterval (1 second)
      );

      // Start with some consumption
      await fastRefillLimiter.consume("capacity-limit-test", 2);

      // Mock time progression - long time
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 10000); // 10 seconds later

      try {
        const result = await fastRefillLimiter.getRemainingTokens("capacity-limit-test");

        // Should be capped at capacity
        expect(result.remainingTokens).toBe(5);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it("should update bucket state when refills occur", async () => {
      const fastRefillLimiter = new TokenBucketRateLimiter(
        redisUri,
        10, // capacity
        3, // refillAmount
        1, // refillInterval (1 second)
      );

      // Consume tokens
      await fastRefillLimiter.consume("state-update-test", 7);

      // Mock time progression
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 1500); // 1.5 seconds later

      try {
        // Check remaining tokens (this should update the bucket state)
        await fastRefillLimiter.getRemainingTokens("state-update-test");

        // Reset time and consume - should work with updated state
        Date.now = originalDateNow;

        const consumeResult = await fastRefillLimiter.consume("state-update-test", 1);
        expect(consumeResult.success).toBe(true);
        // Should have 3 + 3 (refill) - 1 (consumed) = 5 remaining
        expect(consumeResult.remainingTokens).toBe(5);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it("should return consistent nextRefillAt with consume method", async () => {
      const countResult = await rateLimiter.getRemainingTokens("timing-test");
      const consumeResult = await rateLimiter.consume("timing-test", 1);

      // nextRefillAt should be very close (within a few seconds due to execution time)
      const timeDiff = Math.abs(countResult.nextRefillAt - consumeResult.nextRefillAt);
      expect(timeDiff).toBeLessThan(5);
    });

    it("should handle zero tokens correctly", async () => {
      // Consume all tokens
      await rateLimiter.consume("zero-tokens-test", 10);

      const result = await rateLimiter.getRemainingTokens("zero-tokens-test");

      expect(result.remainingTokens).toBe(0);
      expect(result.nextRefillAt).toBeGreaterThan(Date.now() / 1000);
    });

    it("should handle fractional refill calculations", async () => {
      const fractionalLimiter = new TokenBucketRateLimiter(
        redisUri,
        10,
        1,
        0.5, // 0.5 second refill interval
      );

      // Consume all tokens
      await fractionalLimiter.consume("fractional-test", 10);

      // Mock partial refill time
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 1200); // 1.2 seconds later

      try {
        const result = await fractionalLimiter.getRemainingTokens("fractional-test");

        // Should have 2 refills (1.2 / 0.5 = 2.4, floor to 2)
        expect(result.remainingTokens).toBe(2);
      } finally {
        Date.now = originalDateNow;
      }
    });

    it("should handle multiple independent buckets", async () => {
      // Set up different states for different buckets
      await rateLimiter.consume("bucket-a", 2);
      await rateLimiter.consume("bucket-b", 5);
      await rateLimiter.consume("bucket-c", 8);

      // Check each bucket independently
      const resultA = await rateLimiter.getRemainingTokens("bucket-a");
      const resultB = await rateLimiter.getRemainingTokens("bucket-b");
      const resultC = await rateLimiter.getRemainingTokens("bucket-c");

      expect(resultA.remainingTokens).toBe(8);
      expect(resultB.remainingTokens).toBe(5);
      expect(resultC.remainingTokens).toBe(2);
    });

    it("should work correctly after addTokens operation", async () => {
      // Consume some tokens
      await rateLimiter.consume("add-tokens-count-test", 6);

      // Add tokens
      await rateLimiter.addTokens("add-tokens-count-test", 3);

      // Check count
      const result = await rateLimiter.getRemainingTokens("add-tokens-count-test");

      expect(result.remainingTokens).toBe(7); // 10 - 6 + 3 = 7
    });

    it("should work correctly after removeTokens operation", async () => {
      // Remove some tokens
      await rateLimiter.removeTokens("remove-tokens-count-test", 4);

      // Check count
      const result = await rateLimiter.getRemainingTokens("remove-tokens-count-test");

      expect(result.remainingTokens).toBe(6); // 10 - 4 = 6
    });
  });

  describe("getCapacity()", () => {
    it("should return the correct capacity", () => {
      expect(rateLimiter.getCapacity()).toBe(10);

      const customLimiter = new TokenBucketRateLimiter(redisUri, 25, 5, 60);
      expect(customLimiter.getCapacity()).toBe(25);
    });
  });

  describe("Edge cases and integration", () => {
    it("should handle rapid consecutive operations", async () => {
      const operations = [];

      // Launch 5 consume operations simultaneously
      for (let i = 0; i < 5; i++) {
        operations.push(rateLimiter.consume("concurrent-test", 2));
      }

      const results = await Promise.all(operations);

      // Count successful operations
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      // With capacity 10 and consuming 2 each, max 5 should succeed
      expect(successful).toBeLessThanOrEqual(5);
      expect(successful + failed).toBe(5);
    });

    it("should handle very large token requests", async () => {
      const result = await rateLimiter.consume("large-request", 1000000);

      expect(result.success).toBe(false);
      expect(result.remainingTokens).toBe(10); // Should show available tokens
    });

    it("should persist bucket state across multiple operations", async () => {
      // First operation
      await rateLimiter.consume("persist-test", 4);

      // Second operation should see the reduced tokens
      const result = await rateLimiter.consume("persist-test", 7);
      expect(result.success).toBe(false);
      expect(result.remainingTokens).toBe(6); // 10 - 4 = 6
    });

    it("should handle fractional time calculations correctly", async () => {
      const fastRefillLimiter = new TokenBucketRateLimiter(
        redisUri,
        10,
        1,
        0.5, // 0.5 second refill interval
      );

      await fastRefillLimiter.consume("fraction-test", 10);

      // Mock partial refill time
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 750); // 0.75 seconds

      try {
        const result = await fastRefillLimiter.consume("fraction-test", 1);

        expect(result.success).toBe(true);
        // Should have 1 refill (0.75 / 0.5 = 1.5, floor to 1)
        expect(result.remainingTokens).toBe(0); // 0 + 1 - 1 = 0
      } finally {
        Date.now = originalDateNow;
      }
    });
  });
});
