import { TokenBucketRateLimiter } from "./tokenBucket";
import { env } from "$env/dynamic/private";

const transcribeLimitSize = 10;

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
const quarterInHours = 60 / 15;

export const burstCULimiter = new TokenBucketRateLimiter(
  env.REDIS_URI,
  burstLimitSize,
  burstLimitSize / (24 * quarterInHours),
  burstRefillTime,
);
