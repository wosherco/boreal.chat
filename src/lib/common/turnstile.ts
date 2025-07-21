import { dev } from "$app/environment";
import { env } from "$env/dynamic/public";

export const TURNSTILE_SITE_KEY = dev ? "1x00000000000000000000AA" : env.PUBLIC_TURNSTILE_SITE_KEY;
