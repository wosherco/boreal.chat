import { TokenBucketRateLimiter } from "./tokenBucket";
import { env } from "$env/dynamic/private";

const transcribeLimitSize = 10;

if (!env.REDIS_URI) {
  throw new Error("REDIS_URI is not set");
}

export const transcribeRatelimiter = new TokenBucketRateLimiter(
  env.REDIS_URI,
  transcribeLimitSize,
  1,
  30,
);

const localLimitSize = 100000;
const localRefillTime = 3 * 60 * 60; // 3h

export const localCULimiter = new TokenBucketRateLimiter(
  env.REDIS_URI,
  localLimitSize,
  localLimitSize,
  localRefillTime,
);

const burstLimitSize = 200000;
const burstRefillTime = 15 * 60; // 15m
const QUARTERS_PER_HOUR = 60 / 15; // 4 fifteen-minute periods per hour
const HOURS_PER_DAY = 24;
// Refills the full burst limit over 24 hours, distributed across 15-minute intervals

export const burstCULimiter = new TokenBucketRateLimiter(
  env.REDIS_URI,
  burstLimitSize,
  burstLimitSize / (HOURS_PER_DAY * QUARTERS_PER_HOUR), // ~2083 tokens per 15 minutes
  burstRefillTime,
);
