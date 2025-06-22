import { env } from "$env/dynamic/public";
import { PostHog } from "posthog-node";

export const posthog = new PostHog(env.PUBLIC_POSTHOG_API_KEY, {
  host: env.PUBLIC_POSTHOG_HOST,
});
