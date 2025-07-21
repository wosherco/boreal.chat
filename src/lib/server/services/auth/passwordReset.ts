import { encodeHexLowerCase } from "@oslojs/encoding";
import { generateRandomOTP } from "./utils";
import { sha256 } from "@oslojs/crypto/sha2";

import type { RequestEvent } from "@sveltejs/kit";
import type { BackendUser } from "./user";
import { db } from "$lib/server/db";
import {
  passkeyCredentialTable,
  totpCredentialTable,
  userTable,
  passwordResetSessionTable,
  securityKeyCredentialTable,
} from "$lib/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { isPast } from "date-fns";

export async function createPasswordResetSession(
  token: string,
  userId: string,
  email: string,
): Promise<PasswordResetSession> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const [session] = await db
    .insert(passwordResetSessionTable)
    .values({
      id: sessionId,
      userId,
      email,
      expiresAt: new Date(Date.now() + 1000 * 60 * 10),
      code: generateRandomOTP(),
      emailVerified: false,
      twoFactorVerified: false,
    })
    .returning();

  return session;
}

export async function validatePasswordResetSessionToken(
  token: string,
): Promise<PasswordResetSessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const [result] = await db
    .select({
      session: {
        id: passwordResetSessionTable.id,
        userId: passwordResetSessionTable.userId,
        email: passwordResetSessionTable.email,
        code: passwordResetSessionTable.code,
        expiresAt: passwordResetSessionTable.expiresAt,
        emailVerified: passwordResetSessionTable.emailVerified,
        twoFactorVerified: passwordResetSessionTable.twoFactorVerified,
      },
      user: {
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
        passwordHash: userTable.passwordHash,
        emailVerified: userTable.emailVerified,
        registeredTOTP: sql<boolean>`${totpCredentialTable} IS NOT NULL`,
        registeredPasskey: sql<boolean>`${passkeyCredentialTable} IS NOT NULL`,
        registeredSecurityKey: sql<boolean>`${securityKeyCredentialTable} IS NOT NULL`,
        registered2FA: sql<boolean>`${totpCredentialTable} IS NOT NULL OR ${passkeyCredentialTable} IS NOT NULL OR ${securityKeyCredentialTable} IS NOT NULL`,
      },
    })
    .from(passwordResetSessionTable)
    .innerJoin(userTable, eq(passwordResetSessionTable.userId, userTable.id))
    .leftJoin(totpCredentialTable, eq(userTable.id, totpCredentialTable.userId))
    .leftJoin(passkeyCredentialTable, eq(userTable.id, passkeyCredentialTable.userId))
    .leftJoin(securityKeyCredentialTable, eq(userTable.id, securityKeyCredentialTable.userId))
    .where(eq(passwordResetSessionTable.id, sessionId));

  if (result === null) {
    return { session: null, user: null };
  }

  const { session, user } = result;

  if (isPast(session.expiresAt)) {
    await db.delete(passwordResetSessionTable).where(eq(passwordResetSessionTable.id, session.id));
    return { session: null, user: null };
  }
  return { session, user };
}

export async function setPasswordResetSessionAsEmailVerified(sessionId: string): Promise<void> {
  await db
    .update(passwordResetSessionTable)
    .set({ emailVerified: true })
    .where(eq(passwordResetSessionTable.id, sessionId));
}

export async function setPasswordResetSessionAs2FAVerified(sessionId: string): Promise<void> {
  await db
    .update(passwordResetSessionTable)
    .set({ twoFactorVerified: true })
    .where(eq(passwordResetSessionTable.id, sessionId));
}

export async function invalidateUserPasswordResetSessions(userId: string): Promise<void> {
  await db.delete(passwordResetSessionTable).where(eq(passwordResetSessionTable.userId, userId));
}

export async function validatePasswordResetSessionRequest(
  cookies: RequestEvent["cookies"],
): Promise<PasswordResetSessionValidationResult> {
  const token = cookies.get("password_reset_session") ?? null;
  if (token === null) {
    return { session: null, user: null };
  }
  const result = await validatePasswordResetSessionToken(token);
  if (result.session === null) {
    deletePasswordResetSessionTokenCookie(cookies);
  }
  return result;
}

export function setPasswordResetSessionTokenCookie(
  cookies: RequestEvent["cookies"],
  token: string,
  expiresAt: Date,
): void {
  cookies.set("password_reset_session", token, {
    expires: expiresAt,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
    secure: !import.meta.env.DEV,
  });
}

export function deletePasswordResetSessionTokenCookie(cookies: RequestEvent["cookies"]): void {
  cookies.set("password_reset_session", "", {
    maxAge: 0,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
    secure: !import.meta.env.DEV,
  });
}

export interface PasswordResetSession {
  id: string;
  userId: string;
  email: string;
  expiresAt: Date;
  code: string;
  emailVerified: boolean;
  twoFactorVerified: boolean;
}

export type PasswordResetSessionValidationResult =
  | { session: PasswordResetSession; user: BackendUser }
  | { session: null; user: null };
