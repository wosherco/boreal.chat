import { env } from "$env/dynamic/public";

export const BILLING_ENABLED = env.PUBLIC_BILLING_ENABLED === "true";
