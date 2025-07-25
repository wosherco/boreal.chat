import { env } from "$env/dynamic/public";

export const BILLING_ENABLED = env.PUBLIC_BILLING_ENABLED === "true";
export const ANONYMOUS_ALLOWED = env.PUBLIC_ANONYMOUS_USAGE_ENABLED === "true";

export const POSTHOG_PROXY_PATH = "/relay-FesSEfdsfe";
