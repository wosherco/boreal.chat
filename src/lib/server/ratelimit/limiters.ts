import { env } from "$env/dynamic/private";
import {
  DummySlidingWindow,
  DummyTokenBucket,
  IORedisSlidingWindowRateLimiter,
  IORedisTokenBucketRateLimiter,
  IORedisThrottlingRateLimiter,
  DummyThrottling,
} from "pv-ratelimit";
import { Redis } from "ioredis";
import { Duration } from "pv-duration";

const redis = env.REDIS_URL ? new Redis(env.REDIS_URL) : null;

// RATELIMITERS FOR AUTHENTICATION

export const loginThrottler = redis
  ? new IORedisThrottlingRateLimiter(redis, Duration.ofSeconds(1))
  : new DummyThrottling();
export const loginIpLimiter = redis
  ? new IORedisSlidingWindowRateLimiter(redis, 5, Duration.ofSeconds(1))
  : new DummySlidingWindow();
export const registerIpLimiter = redis
  ? new IORedisSlidingWindowRateLimiter(redis, 3, Duration.ofSeconds(10))
  : new DummySlidingWindow();
export const recoveryCodeLimiter = redis
  ? new IORedisSlidingWindowRateLimiter(redis, 3, Duration.ofHours(1))
  : new DummySlidingWindow();
// Password reset email verification limiter: 5 attempts per hour per IP
export const passwordResetVerifyLimiter = redis
  ? new IORedisSlidingWindowRateLimiter(redis, 5, Duration.ofHours(1))
  : new DummySlidingWindow();

// RATELIMITER FOR WEB AUTHN
const webauthnLimitSize = 50;
export const webauthnRatelimiter = redis
  ? new IORedisSlidingWindowRateLimiter(redis, webauthnLimitSize, Duration.ofSeconds(30))
  : new DummySlidingWindow();

// RATELIMITER FOR MIC TRANSCRIBE

const transcribeLimitSize = 20;
export const transcribeRatelimiter = redis
  ? new IORedisSlidingWindowRateLimiter(redis, transcribeLimitSize, Duration.ofMinutes(10))
  : new DummySlidingWindow();

// RATELIMITERS FOR UNLIIMITED AI CHAT

const localLimitSize = 100000;
const localRefillTime = 3 * 60 * 60; // 3h

export const localCULimiter = redis
  ? new IORedisTokenBucketRateLimiter(
      redis,
      localLimitSize,
      localLimitSize,
      Duration.ofSeconds(localRefillTime),
    )
  : new DummyTokenBucket();

const burstLimitSize = 200000;
const burstRefillTime = 15 * 60; // 15m
const QUARTERS_PER_HOUR = 60 / 15; // 4 fifteen-minute periods per hour
const HOURS_PER_DAY = 24;
// Refills the full burst limit over 24 hours, distributed across 15-minute intervals

export const burstCULimiter = redis
  ? new IORedisTokenBucketRateLimiter(
      redis,
      burstLimitSize,
      burstLimitSize / (HOURS_PER_DAY * QUARTERS_PER_HOUR),
      Duration.ofSeconds(burstRefillTime),
    )
  : new DummyTokenBucket();
