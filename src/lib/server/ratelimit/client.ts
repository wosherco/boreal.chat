import { env } from "$env/dynamic/private";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export { Ratelimit };

export function createRatelimit(
  identifier: string,
  limiter: ReturnType<typeof Ratelimit.slidingWindow>,
) {
  const ratelimiter =
    env.RATE_LIMIT_ENABLED !== "true"
      ? undefined
      : new Ratelimit({
          redis: Redis.fromEnv(),
          limiter,
          prefix: identifier,
        });

  const limit = async (identifier: string) => {
    if (!ratelimiter) {
      return {
        success: true,
        limit: 999999999,
        pending: Promise.resolve(),
        remaining: 999999999,
        reset: Date.now() + 999999999,
      } satisfies Awaited<ReturnType<Ratelimit["limit"]>>;
    }
    return ratelimiter.limit(identifier);
  };

  return { limit, _ratelimiter: ratelimiter };
}
