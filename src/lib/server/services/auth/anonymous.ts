import { userTable } from "$lib/client/db/schema";
import { db } from "$lib/server/db";
import { sessionTable, type Session } from "$lib/server/db/schema";
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
