import * as Sentry from "@sentry/sveltekit";
import { sequence } from "@sveltejs/kit/hooks";
import * as auth from "$lib/server/auth.js";
import type { Handle } from "@sveltejs/kit";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { posthog } from "$lib/server/posthog";
import { POSTHOG_PROXY_PATH } from "$lib/common/constants";

process.on("SIGINT", async () => {
  await posthog?.shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await posthog?.shutdown();
  process.exit(0);
});

Sentry.init({
  dsn: publicEnv.PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  _experiments: {
    enableLogs: true,
  },
});

if (publicEnv.PUBLIC_ENVIRONMENT === "development") {
  // Not initializing Sentry in development to avoid sending events to Sentry
  Sentry.init({});
}

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;

    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace("%paraglide.lang%", locale),
    });
  });

const handleAuth: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get(auth.sessionCookieName);

  if (!sessionToken) {
    event.locals.user = null;
    event.locals.session = null;
    return resolve(event);
  }

  const { session, user } = await auth.validateSessionToken(sessionToken);

  if (session) {
    auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
  } else {
    auth.deleteSessionTokenCookie(event);
  }

  event.locals.user = user;
  event.locals.session = session;
  return resolve(event);
};

const posthogProxyHandle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname.startsWith(POSTHOG_PROXY_PATH)) {
    // Determine target hostname based on static or dynamic ingestion
    const hostname = pathname.startsWith(`${POSTHOG_PROXY_PATH}/static/`)
      ? "eu-assets.i.posthog.com"
      : "eu.i.posthog.com";

    // Build external URL
    const url = new URL(event.request.url);
    url.protocol = "https:";
    url.hostname = hostname;
    url.port = "443";
    url.pathname = pathname.replace(`${POSTHOG_PROXY_PATH}/`, "");

    // Clone and adjust headers
    const headers = new Headers(event.request.headers);
    headers.set("host", hostname);

    // Proxy the request to the external host
    const response = await fetch(url.toString(), {
      method: event.request.method,
      headers,
      body: event.request.body,
      // @ts-expect-error - duplex is a node-specific property
      duplex: "half",
    });

    return response;
  }

  const response = await resolve(event);
  return response;
};

const flagsmithSSRHandle: Handle = async ({ event, resolve }) => {
  // Initialize Flagsmith SSR flags if environment key is available
  if (publicEnv.PUBLIC_FLAGSMITH_ENVIRONMENT_KEY) {
    try {
      const { flagsmith } = await import("$lib/server/flagsmith");
      if (flagsmith) {
        // Get environment flags for SSR
        const flags = await flagsmith.getEnvironmentFlags();
        const flagsObject: Record<string, any> = {};
        
        if (Array.isArray(flags)) {
          flags.forEach((flag: any) => {
            flagsObject[flag.feature.name] = {
              enabled: flag.enabled,
              value: flag.feature_state_value,
            };
          });
        }
        
        // Add flags to event locals for use in load functions
        event.locals.flagsmithFlags = flagsObject;
      }
    } catch (error) {
      console.error("Failed to initialize Flagsmith SSR:", error);
      event.locals.flagsmithFlags = null;
    }
  } else {
    event.locals.flagsmithFlags = null;
  }

  return resolve(event);
};

export const handle: Handle = sequence(
  Sentry.sentryHandle(),
  posthogProxyHandle,
  flagsmithSSRHandle,
  sequence(handleParaglide, handleAuth),
);

export const handleError = Sentry.handleErrorWithSentry();
