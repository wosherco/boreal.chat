import type { RequestEvent } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "$lib/server/db";
import { sessionTable, userTable, type Session } from "./db/schema";
import { Google } from "arctic";
import { env } from "$env/dynamic/private";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = "auth-session";

export function generateSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const token = encodeBase64url(bytes);
  return token;
}

export async function createSession(token: string, userId: string, twoFactorVerified: boolean) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + DAY_IN_MS * 30),
    twoFactorVerified,
  };
  await db.insert(sessionTable).values(session);
  return session;
}

export async function validateSessionToken(token: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const [result] = await db
    .select({
      // Adjust user table here to tweak returned data
      user: userTable,
      session: sessionTable,
    })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
    .where(eq(sessionTable.id, sessionId));

  if (!result) {
    return { session: null, user: null };
  }
  const { session, user } = result;

  const sessionExpired = Date.now() >= session.expiresAt.getTime();
  if (sessionExpired) {
    await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
    return { session: null, user: null };
  }

  const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
  if (renewSession) {
    session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
    await db
      .update(sessionTable)
      .set({ expiresAt: session.expiresAt })
      .where(eq(sessionTable.id, session.id));
  }

  return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

export async function invalidateUserSessions(userId: string) {
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
}

export function setSessionTokenCookie(
  cookies: RequestEvent["cookies"],
  token: string,
  expiresAt: Date,
) {
  cookies.set(sessionCookieName, token, {
    expires: expiresAt,
    path: "/",
  });
}

export function deleteSessionTokenCookie(cookies: RequestEvent["cookies"]) {
  cookies.delete(sessionCookieName, {
    path: "/",
  });
}

export const googleProvider = new Google(
  env.GOOGLE_AUTH_CLIENT_ID!,
  env.GOOGLE_AUTH_CLIENT_SECRET!,
  env.GOOGLE_AUTH_REDIRECT_URI!,
);
