import { env } from "$env/dynamic/private";
import Redis from "ioredis";
import type { FlagsmithCache } from "flagsmith-nodejs";
import { Flagsmith, Flags } from "flagsmith-nodejs";
import type { FeatureFlag } from "$lib/common/featureFlags";

const flagsmithRedis =
  env.REDIS_URL && env.SERVER_FLAGSMITH_ENVIRONMENT_ID ? new Redis(env.REDIS_URL) : null;

const redisFlagsmithCache = {
  async get(key: string): Promise<Flags | undefined> {
    if (!flagsmithRedis) {
      return;
    }

    const cachedValue = await flagsmithRedis.get(key);
    if (cachedValue) {
      return new Flags(JSON.parse(cachedValue));
    }
  },
  async set(key: string, value: Flags): Promise<void> {
    if (!flagsmithRedis) {
      return;
    }

    await flagsmithRedis.setex(key, 60, JSON.stringify(value));
  },
} satisfies FlagsmithCache;

const flagsmith = env.SERVER_FLAGSMITH_ENVIRONMENT_ID
  ? new Flagsmith({
      environmentKey: env.SERVER_FLAGSMITH_ENVIRONMENT_ID,
      cache: redisFlagsmithCache,
    })
  : null;

export async function getServerSideUserFeatureFlag(
  userId: string,
  flag: FeatureFlag,
): Promise<{ enabled: boolean; value: undefined }> {
  if (!flagsmith) {
    return {
      enabled: flag.defaultToggle,
      value: undefined,
    };
  }

  const flags = await flagsmith.getIdentityFlags(userId);
  const flagValue = flags.isFeatureEnabled(flag.name);

  return {
    enabled: flagValue,
    value: undefined,
  };
}
