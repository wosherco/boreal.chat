import { env } from "$env/dynamic/public";

export const BILLING_ENABLED = env.PUBLIC_BILLING_ENABLED === "true";

export const POSTHOG_PROXY_PATH = "/relay-FesSEfdsfe";

// Flagsmith constants
export const FLAGSMITH_API_URL = env.PUBLIC_FLAGSMITH_API_URL || "https://edge.api.flagsmith.com/api/v1/";
export const FLAGSMITH_ENVIRONMENT_KEY = env.PUBLIC_FLAGSMITH_ENVIRONMENT_KEY;
