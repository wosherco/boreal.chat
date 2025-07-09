import { TokenBucketRateLimiter } from "./tokenBucket";

const transcribeLimitSize = 10;

export const transcribeRatelimiter = new TokenBucketRateLimiter(transcribeLimitSize, 1, 30);

const localLimitSize = 100000;
const localRefillTime = 3 * 60 * 60; // 3h

export const localCULimiter = new TokenBucketRateLimiter(
  localLimitSize,
  localLimitSize,
  localRefillTime,
);

const burstLimitSize = 200000;
const burstRefillTime = 15 * 60; // 15m

export const burstCULimiter = new TokenBucketRateLimiter(
  burstLimitSize,
  burstLimitSize / (24 * 15),
  burstRefillTime,
);
