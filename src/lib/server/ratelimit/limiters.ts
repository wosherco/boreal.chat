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
  ? new IORedisThrottlingRateLimiter(redis, "login", Duration.ofSeconds(1))
  : new DummyThrottling();
export const loginIpLimiter = redis
  ? new IORedisSlidingWindowRateLimiter(redis, "login-ip", 5, Duration.ofSeconds(1))
  : new DummySlidingWindow();
export const registerIpLimiter = redis
  ? new IORedisSlidingWindowRateLimiter(redis, "register-ip", 3, Duration.ofSeconds(10))
  : new DummySlidingWindow();
export const recoveryCodeLimiter = redis
  ? new IORedisSlidingWindowRateLimiter(redis, "recovery-code", 3, Duration.ofHours(1))
  : new DummySlidingWindow();
// Password reset email verification limiter: 5 attempts per hour per IP
export const passwordResetVerifyLimiter = redis
  ? new IORedisSlidingWindowRateLimiter(redis, "password-reset-verify", 5, Duration.ofHours(1))
  : new DummySlidingWindow();

// RATELIMITER FOR WEB AUTHN
const webauthnLimitSize = 50;
export const webauthnRatelimiter = redis
  ? new IORedisSlidingWindowRateLimiter(
      redis,
      "webauthn",
      webauthnLimitSize,
      Duration.ofSeconds(30),
    )
  : new DummySlidingWindow();

// RATELIMITER FOR MIC TRANSCRIBE

const transcribeLimitSize = 20;
export const transcribeRatelimiter = redis
  ? new IORedisSlidingWindowRateLimiter(
      redis,
      "transcribe",
      transcribeLimitSize,
      Duration.ofMinutes(10),
    )
  : new DummySlidingWindow();

// RATELIMITERS FOR FREE USERS

const anonymousLimitSize = 10000;
const anonymousRefillTime = 1 * 60 * 60; // 1h

export const anonymousCULimiter = redis
  ? new IORedisTokenBucketRateLimiter(
      redis,
      "anonymous",
      anonymousLimitSize,
      anonymousLimitSize,
      Duration.ofSeconds(anonymousRefillTime),
    )
  : new DummyTokenBucket();

const freeLimitSize = 20000;
const freeRefillTime = 1 * 60 * 60; // 1h

export const freeCULimiter = redis
  ? new IORedisTokenBucketRateLimiter(
      redis,
      "free",
      freeLimitSize,
      freeLimitSize,
      Duration.ofSeconds(freeRefillTime),
    )
  : new DummyTokenBucket();

// We add a more generous IP limiter so people don't create multiple accounts to bypass the limit
const ipLimitSize = anonymousLimitSize * 4;
const ipRefillTime = anonymousRefillTime;

export const ipCULimiter = redis
  ? new IORedisTokenBucketRateLimiter(
      redis,
      "ip",
      ipLimitSize,
      ipLimitSize,
      Duration.ofSeconds(ipRefillTime),
    )
  : new DummyTokenBucket();

// RATELIMITERS FOR UNLIMITED AI CHAT

const unlimitedLocalLimitSize = 100000;
const unlimitedLocalRefillTime = 3 * 60 * 60; // 3h

export const localCULimiter = redis
  ? new IORedisTokenBucketRateLimiter(
      redis,
      "local",
      unlimitedLocalLimitSize,
      unlimitedLocalLimitSize,
      Duration.ofSeconds(unlimitedLocalRefillTime),
    )
  : new DummyTokenBucket();

const unlimitedBurstLimitSize = 200000;
const unlimitedBurstRefillTime = 15 * 60; // 15m
const QUARTERS_PER_HOUR = 60 / 15; // 4 fifteen-minute periods per hour
const HOURS_PER_DAY = 24;
// Refills the full burst limit over 24 hours, distributed across 15-minute intervals

export const burstCULimiter = redis
  ? new IORedisTokenBucketRateLimiter(
      redis,
      "burst",
      unlimitedBurstLimitSize,
      unlimitedBurstLimitSize / (HOURS_PER_DAY * QUARTERS_PER_HOUR),
      Duration.ofSeconds(unlimitedBurstRefillTime),
    )
  : new DummyTokenBucket();
