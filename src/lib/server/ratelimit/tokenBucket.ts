import { env } from "$env/dynamic/private";
import Redis from "ioredis";

const DISABLED_RATELIMIT_CLIENT = {} as Redis;

declare module "ioredis" {
  interface Redis {
    consumeToken(
      key: string,
      capacity: number,
      refillAmount: number,
      refillInterval: number,
      currentTime: number,
      requestedTokens: number,
    ): Promise<[number, number, number]>; // [success_flag, remaining_tokens, next_refill_at]
  }
}

export interface ConsumeResult {
  /** Indicates whether the tokens were successfully consumed. */
  success: boolean;
  /** The number of tokens remaining in the bucket after this operation. */
  remainingTokens: number;
  /** A Unix timestamp (in seconds) indicating when the next refill will occur. */
  nextRefillAt: number;
}

export class TokenBucketRateLimiter {
  private redis: Redis;
  private capacity: number;
  private refillAmount: number;
  private refillInterval: number;

  constructor(
    capacity: number,
    refillAmount: number,
    /*
     * In seconds
     */
    refillInterval: number,
  ) {
    const redisClient =
      env.RATE_LIMIT_ENABLED === "true" ? new Redis(env.REDIS_URL) : DISABLED_RATELIMIT_CLIENT;

    if (capacity <= 0 || refillAmount <= 0 || refillInterval <= 0) {
      throw new Error("Capacity, refill amount, and interval must be positive values.");
    }

    this.redis = redisClient;
    this.capacity = capacity;
    this.refillAmount = refillAmount;
    this.refillInterval = refillInterval;

    if (redisClient === DISABLED_RATELIMIT_CLIENT) {
      console.warn("Rate limiting is disabled");
      return;
    }

    // Define the Lua script for consumption and register it with ioredis.
    // This script is executed atomically on the Redis server.
    this.redis.defineCommand("consumeToken", {
      numberOfKeys: 1,
      lua: `
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_amount = tonumber(ARGV[2])
        local refill_interval = tonumber(ARGV[3])
        local current_time = tonumber(ARGV[4])
        local requested_tokens = tonumber(ARGV[5])

        local bucket = redis.call('HGETALL', key)
        local last_tokens = 0
        local last_updated = current_time 

        if #bucket > 0 then
            for i=1, #bucket, 2 do
                if bucket[i] == 'tokens' then
                    last_tokens = tonumber(bucket[i+1])
                elseif bucket[i] == 'last_updated' then
                    last_updated = tonumber(bucket[i+1])
                end
            end
        else
            last_tokens = capacity
        end

        local elapsed_time = current_time - last_updated
        local current_tokens = last_tokens
        local new_last_updated = last_updated

        if elapsed_time >= refill_interval then
            local refills_to_add = math.floor(elapsed_time / refill_interval)
            local tokens_to_add = refills_to_add * refill_amount
            current_tokens = math.min(capacity, last_tokens + tokens_to_add)
            new_last_updated = last_updated + (refills_to_add * refill_interval)
        end
        
        local next_refill_at = new_last_updated + refill_interval

        if current_tokens >= requested_tokens then
            local remaining_tokens = current_tokens - requested_tokens
            redis.call('HSET', key, 'tokens', remaining_tokens, 'last_updated', new_last_updated)
            -- Return [success_flag, remaining_tokens, next_refill_at]
            return {1, remaining_tokens, next_refill_at}
        else
            -- On failure, return current tokens without consuming any.
            return {0, current_tokens, next_refill_at}
        end
      `,
    });
  }

  /**
   * Attempts to consume a specified number of tokens from the bucket.
   * @param key A unique identifier for the bucket (e.g., user ID, IP address).
   * @param tokens The number of tokens to consume (defaults to 1).
   * @returns A promise that resolves to true if tokens were consumed, false otherwise.
   */
  public async consume(key: string, tokens: number = 1): Promise<ConsumeResult> {
    if (this.redis === DISABLED_RATELIMIT_CLIENT) {
      return {
        success: true,
        remainingTokens: this.capacity,
        nextRefillAt: Date.now() + 9999,
      };
    }

    const prefix = "token_bucket";
    const redisKey = `${prefix}:${key}`;

    const [successFlag, remaining, nextRefill] = await this.redis.consumeToken(
      redisKey,
      this.capacity,
      this.refillAmount,
      this.refillInterval,
      Date.now() / 1000, // Pass current time in seconds
      tokens,
    );

    return {
      success: successFlag === 1,
      remainingTokens: Math.floor(remaining), // Return a whole number
      nextRefillAt: Math.ceil(nextRefill), // Round up to be safe
    };
  }

  public async addTokens(key: string, amount: number): Promise<void> {
    if (this.redis === DISABLED_RATELIMIT_CLIENT) {
      return;
    }

    if (amount <= 0) return;
    const prefix = "token_bucket";
    const redisKey = `${prefix}:${key}`;
    const addScript = `
        local current_val = redis.call('HINCRBYFLOAT', KEYS[1], 'tokens', ARGV[1])
        local capacity = tonumber(ARGV[2])
        if tonumber(current_val) > capacity then
            redis.call('HSET', KEYS[1], 'tokens', capacity)
        end
        return 0
    `;
    await this.redis.eval(addScript, 1, redisKey, amount, this.capacity);
  }

  public async removeTokens(key: string, amount: number): Promise<void> {
    if (this.redis === DISABLED_RATELIMIT_CLIENT) {
      return;
    }

    if (amount <= 0) return;
    const prefix = "token_bucket";
    const redisKey = `${prefix}:${key}`;
    const removeScript = `
        local current_val = redis.call('HINCRBYFLOAT', KEYS[1], 'tokens', -tonumber(ARGV[1]))
        if tonumber(current_val) < 0 then
            redis.call('HSET', KEYS[1], 'tokens', 0)
        end
        return 0
    `;
    await this.redis.eval(removeScript, 1, redisKey, amount);
  }

  public getCapacity(): number {
    return this.capacity;
  }
}
