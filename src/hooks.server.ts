import * as Sentry from "@sentry/sveltekit";
import { sequence } from "@sveltejs/kit/hooks";
import * as auth from "$lib/server/auth.js";
import type { Handle } from "@sveltejs/kit";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { env } from "$env/dynamic/private";
import { posthog } from "$lib/server/posthog";

process.on("SIGINT", async () => {
  await posthog.shutdown();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await posthog.shutdown();
  process.exit(0);
});

Sentry.init({
  dsn: env.PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  _experiments: {
    enableLogs: true,
  },
});

if (env.PUBLIC_ENVIRONMENT === "development") {
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

export const handle: Handle = sequence(
  Sentry.sentryHandle(),
  sequence(handleParaglide, handleAuth),
);

export const handleError = Sentry.handleErrorWithSentry();
