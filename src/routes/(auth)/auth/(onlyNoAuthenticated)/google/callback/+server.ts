import { decodeIdToken, type OAuth2Tokens } from "arctic";
import type { RequestHandler } from "./$types";
import {
  createSession,
  generateSessionToken,
  googleProvider,
  setSessionTokenCookie,
} from "$lib/server/auth";
import { db } from "$lib/server/db";
import { accountTable } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { posthog } from "$lib/server/posthog";
import { finishLogin, getUserById } from "$lib/server/services/auth/user";
import { get2FARedirect } from "$lib/server/services/auth/2fa";
import { createUser } from "$lib/server/services/auth/user";
import { isAnonymousUser } from "$lib/common/utils/anonymous";

export const GET: RequestHandler = async (event) => {
  const code = event.url.searchParams.get("code");
  const state = event.url.searchParams.get("state");
  const storedState = event.cookies.get("google_oauth_state") ?? null;
  const codeVerifier = event.cookies.get("google_code_verifier") ?? null;

  if (code === null || state === null || storedState === null || codeVerifier === null) {
    return new Response("Missing required parameters.", {
      status: 400,
    });
  }
  if (state !== storedState) {
    return new Response("State mismatch.", {
      status: 400,
    });
  }

  let tokens: OAuth2Tokens;
  try {
    tokens = await googleProvider.validateAuthorizationCode(code, codeVerifier);
  } catch (e) {
    console.error(e);

    // Invalid code or client credentials
    return new Response("Invalid code or client credentials.", {
      status: 400,
    });
  }

  // https://developers.google.com/identity/gsi/web/guides/verify-google-id-token#using-a-google-api-client-library
  const claims = decodeIdToken(tokens.idToken()) as {
    sub: string;
    name: string;
    picture: string;
    family_name: string;
    given_name: string;
    email: string;
    email_verified: boolean;
  };

  const googleUserId = claims.sub;

  const [existingAccount] = await db
    .select()
    .from(accountTable)
    .where(and(eq(accountTable.platform, "GOOGLE"), eq(accountTable.platformId, googleUserId)));

  // Existing User
  if (existingAccount !== undefined) {
    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, existingAccount.userId, false);
    setSessionTokenCookie(event.cookies, sessionToken, session.expiresAt);

    await finishLogin(
      existingAccount.userId,
      event.locals.user && isAnonymousUser(event.locals.user) ? event.locals.user.id : undefined,
    );

    const existingBackendUser = await getUserById(existingAccount.userId);

    if (existingBackendUser?.registered2FA) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: get2FARedirect(existingBackendUser) ?? "/",
        },
      });
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  }

  const user = await db.transaction(async (tx) => {
    const user = await createUser(tx, {
      email: claims.email,
      name: `${claims.given_name} ${claims.family_name}`,
      profilePicture: claims.picture,
      anonymousId:
        event.locals.user && isAnonymousUser(event.locals.user) ? event.locals.user.id : undefined,
    });

    if (!user) {
      throw new Error("Failed to create user");
    }

    await tx.insert(accountTable).values({
      platform: "GOOGLE",
      platformId: googleUserId,
      userId: user.id,
    });

    posthog?.capture({
      distinctId: user.id,
      event: "user_signed_up",
      properties: {
        $set: {
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
        },
      },
    });

    return user;
  });

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id, false);
  setSessionTokenCookie(event.cookies, sessionToken, session.expiresAt);

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
    },
  });
};
