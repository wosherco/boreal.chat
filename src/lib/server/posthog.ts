import { PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_API_KEY } from "$env/static/public";
import { PostHog } from "posthog-node";

export const posthog = PUBLIC_POSTHOG_API_KEY
  ? new PostHog(PUBLIC_POSTHOG_API_KEY, {
      host: PUBLIC_POSTHOG_HOST,
    })
  : null;
