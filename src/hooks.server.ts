import * as Sentry from "@sentry/sveltekit";
import { sequence } from "@sveltejs/kit/hooks";
import * as auth from "$lib/server/auth.js";
import type { Handle } from "@sveltejs/kit";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { env } from "$env/dynamic/public";
import { posthog } from "$lib/server/posthog";
import { POSTHOG_PROXY_PATH } from "$lib/common/constants";
import { startCronJobs, stopCronJobs } from "$lib/server/services/cron";
import { dev } from "$app/environment";
import { createAnonymousUser } from "$lib/server/services/auth/anonymous";

process.on("SIGINT", async () => {
  stopCronJobs();
  await posthog?.shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  stopCronJobs();
  await posthog?.shutdown();
  process.exit(0);
});

Sentry.init({
  dsn: env.PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  _experiments: {
    enableLogs: true,
  },
  integrations: [Sentry.consoleLoggingIntegration({ levels: ["log", "error", "warn"] })],
});

if (dev) {
  // Not initializing Sentry in development to avoid sending events to Sentry
  Sentry.init({});
}

// Start cron jobs on server startup
startCronJobs();

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
    const createdAnonymousUser = await createAnonymousUser();
    const sessionToken = auth.generateSessionToken();
    const createdSession = await auth.createSession(sessionToken, createdAnonymousUser.id, false);
    auth.setSessionTokenCookie(event.cookies, sessionToken, createdSession.expiresAt);

    const { session, user } = await auth.validateSessionToken(sessionToken);
    if (!user || !session) {
      throw new Error("Failed to create anonymous user or session");
    }

    event.locals.user = user;
    event.locals.session = session;
    return resolve(event);
  }

  const { session, user } = await auth.validateSessionToken(sessionToken);

  if (session) {
    auth.setSessionTokenCookie(event.cookies, sessionToken, session.expiresAt);
  } else {
    auth.deleteSessionTokenCookie(event.cookies);
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

export const handle: Handle = sequence(
  Sentry.sentryHandle(),
  posthogProxyHandle,
  sequence(handleParaglide, handleAuth),
);

export const handleError = Sentry.handleErrorWithSentry();
