import type { transcribeRatelimiter } from "./limiters";
import type { ConsumeResult } from "./tokenBucket";

export * from "./limiters";

export function getRatelimitConsumeHeaders(
  ratelimit: typeof transcribeRatelimiter,
  result: ConsumeResult,
) {
  return {
    "X-RateLimit-Limit": ratelimit.getCapacity().toString(),
    "X-RateLimit-Remaining": result.remainingTokens.toString(),
    "X-RateLimit-Reset": result.nextRefillAt.toString(),
  };
}
