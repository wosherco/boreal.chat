import { env } from "$env/dynamic/public";
import { PostHog } from "posthog-node";

export const posthog = env.PUBLIC_POSTHOG_API_KEY
  ? new PostHog(env.PUBLIC_POSTHOG_API_KEY, {
      host: env.PUBLIC_POSTHOG_HOST,
    })
  : null;
