import { db } from "$lib/server/db";
import { emailVerificationRequestTable } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import { generateRandomOTP } from "./utils";
import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

import type { RequestEvent } from "@sveltejs/kit";
import type { BackendUser } from "./user";

export async function getUserEmailVerificationRequest(
  userId: string,
  id: string,
): Promise<EmailVerificationRequest | null> {
  const [emailVerificationRequest] = await db
    .select({
      id: emailVerificationRequestTable.id,
      userId: emailVerificationRequestTable.userId,
      code: emailVerificationRequestTable.code,
      email: emailVerificationRequestTable.email,
      expiresAt: emailVerificationRequestTable.expiresAt,
    })
    .from(emailVerificationRequestTable)
    .where(
      and(
        eq(emailVerificationRequestTable.id, id),
        eq(emailVerificationRequestTable.userId, userId),
      ),
    );

  if (!emailVerificationRequest) {
    return null;
  }

  return emailVerificationRequest;
}

export async function createEmailVerificationRequest(
  userId: string,
  email: string,
): Promise<EmailVerificationRequest> {
  await deleteUserEmailVerificationRequest(userId);
  const idBytes = new Uint8Array(20);
  crypto.getRandomValues(idBytes);
  const id = encodeBase32LowerCaseNoPadding(idBytes);

  const code = generateRandomOTP();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10);
  await db.insert(emailVerificationRequestTable).values({
    id,
    userId,
    code,
    email,
    expiresAt,
  });

  const request: EmailVerificationRequest = {
    id,
    userId,
    code,
    email,
    expiresAt,
  };
  return request;
}

export async function deleteUserEmailVerificationRequest(userId: string): Promise<void> {
  await db
    .delete(emailVerificationRequestTable)
    .where(eq(emailVerificationRequestTable.userId, userId));
}

export function setEmailVerificationRequestCookie(
  cookies: RequestEvent["cookies"],
  request: EmailVerificationRequest,
): void {
  cookies.set("email_verification", request.id, {
    httpOnly: true,
    path: "/",
    secure: import.meta.env.PROD,
    sameSite: "lax",
    expires: request.expiresAt,
  });
}

export function deleteEmailVerificationRequestCookie(cookies: RequestEvent["cookies"]): void {
  cookies.set("email_verification", "", {
    httpOnly: true,
    path: "/",
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 0,
  });
}

export async function getUserEmailVerificationRequestFromRequest(
  user: Pick<BackendUser, "id">,
  cookies: RequestEvent["cookies"],
): Promise<EmailVerificationRequest | null> {
  if (user === null) {
    return null;
  }
  const id = cookies.get("email_verification") ?? null;
  if (id === null) {
    return null;
  }
  const request = await getUserEmailVerificationRequest(user.id, id);
  if (request === null) {
    deleteEmailVerificationRequestCookie(cookies);
  }
  return request;
}

export interface EmailVerificationRequest {
  id: string;
  userId: string;
  code: string;
  email: string;
  expiresAt: Date;
}
