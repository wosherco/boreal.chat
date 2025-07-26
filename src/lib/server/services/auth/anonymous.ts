import { invalidateUserSessions } from "$lib/server/auth";
import { db } from "$lib/server/db";
import {
  anonymousUserConversionTable,
  chatTable,
  sessionTable,
  threadTable,
  messageTable,
  userTable,
  type Session,
  messageSegmentsTable,
  messageSegmentUsageTable,
  draftsTable,
} from "$lib/server/db/schema";
import { verifyTurnstileToken } from "$lib/server/utils/turnstile";
import { addMinutes, isFuture } from "date-fns";
import { eq } from "drizzle-orm";

export async function createAnonymousUser() {
  const id = crypto.randomUUID();
  const [user] = await db
    .insert(userTable)
    .values({
      id,
      email: `${id}@anonymous.com`,
      name: "Anonymous",
      role: "ANONYMOUS",
    })
    .returning();

  if (!user) {
    throw new Error("Failed to create anonymous user");
  }

  return user;
}

/**
 * Checks if an anonymous session is verified. A session is verified if the captcha was verified within the last 10 minutes and the client IP is the same as the one used to verify the captcha.
 * @param session - The session to check.
 * @param clientIp - The current client IP address.
 * @returns True if the session is verified, false otherwise.
 */
export function isAnonymousSessionVerified(session: Session, clientIp: string) {
  return (
    session.captchaVerifiedAt &&
    session.verifiedClientIp === clientIp &&
    isFuture(addMinutes(session.captchaVerifiedAt, 10))
  );
}

/**
 * Verifies an anonymous session.
 * @param session - The session to verify.
 * @param turnstileToken - The turnstile token to verify.
 * @param clientIp - The current client IP address.
 * @returns True if the session is verified, false otherwise.
 */
export async function verifyAnonymousSession(
  session: Session,
  turnstileToken: string,
  clientIp: string,
): Promise<boolean> {
  if (isAnonymousSessionVerified(session, clientIp)) {
    return true;
  }

  const verified = await verifyTurnstileToken(turnstileToken, clientIp, true);

  if (!verified) {
    return false;
  }

  await db
    .update(sessionTable)
    .set({
      captchaVerifiedAt: new Date(),
      verifiedClientIp: clientIp,
    })
    .where(eq(sessionTable.id, session.id));

  return true;
}

export async function convertAnonymousUser(
  anonymousUserId: string,
  newUserId: string,
  transferContent: boolean,
) {
  await db.insert(anonymousUserConversionTable).values({
    anonymousUserId,
    newUserId,
    transferContent,
  });
  await invalidateUserSessions(anonymousUserId);

  if (transferContent) {
    // Transfering chats and messages
    await Promise.all([
      db
        .update(chatTable)
        .set({
          userId: newUserId,
        })
        .where(eq(chatTable.userId, anonymousUserId))
        .execute(),
      db
        .update(threadTable)
        .set({
          userId: newUserId,
        })
        .where(eq(threadTable.userId, anonymousUserId))
        .execute(),
      db
        .update(messageTable)
        .set({
          userId: newUserId,
        })
        .where(eq(messageTable.userId, anonymousUserId))
        .execute(),
      db
        .update(messageSegmentsTable)
        .set({
          userId: newUserId,
        })
        .where(eq(messageSegmentsTable.userId, anonymousUserId))
        .execute(),
      db
        .update(messageSegmentUsageTable)
        .set({
          userId: newUserId,
        })
        .where(eq(messageSegmentUsageTable.userId, anonymousUserId))
        .execute(),
      db
        .update(draftsTable)
        .set({
          userId: newUserId,
        })
        .where(eq(draftsTable.userId, anonymousUserId))
        .execute(),
    ]);
  }
}
