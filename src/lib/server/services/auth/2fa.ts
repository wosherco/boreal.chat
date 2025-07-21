import { generateRandomRecoveryCode } from "./utils";
import { decryptToString, encryptString } from "./encryption";
import { db } from "$lib/server/db";
import {
  passkeyCredentialTable,
  securityKeyCredentialTable,
  sessionTable,
  totpCredentialTable,
  userTable,
} from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import type { BackendUser } from "./user";

export async function resetUser2FAWithRecoveryCode(
  userId: string,
  recoveryCode: string,
): Promise<boolean> {
  return await db.transaction(async (tx) => {
    const [user] = await tx
      .select({
        id: userTable.id,
        recoveryCode: userTable.recoveryCode,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .for("update");

    if (!user || !user.recoveryCode) {
      return false;
    }

    const userRecoveryCode = decryptToString(user.recoveryCode);
    if (recoveryCode !== userRecoveryCode) {
      return false;
    }

    const newRecoveryCode = generateRandomRecoveryCode();
    const encryptedNewRecoveryCode = encryptString(newRecoveryCode);

    const [updatedUser] = await tx
      .update(userTable)
      .set({ recoveryCode: Buffer.from(encryptedNewRecoveryCode) })
      .where(and(eq(userTable.id, userId), eq(userTable.recoveryCode, user.recoveryCode)))
      .returning();

    if (!updatedUser) {
      return false;
    }

    await tx
      .update(sessionTable)
      .set({ twoFactorVerified: false })
      .where(eq(sessionTable.userId, userId));
    await tx.delete(totpCredentialTable).where(eq(totpCredentialTable.userId, userId));
    await tx.delete(passkeyCredentialTable).where(eq(passkeyCredentialTable.userId, userId));
    await tx
      .delete(securityKeyCredentialTable)
      .where(eq(securityKeyCredentialTable.userId, userId));

    return true;
  });
}

export function get2FARedirect(user: BackendUser): string | undefined {
  if (user.registeredPasskey) {
    return "/auth/2fa/passkey";
  }
  if (user.registeredSecurityKey) {
    return "/auth/2fa/security-key";
  }
  if (user.registeredTOTP) {
    return "/auth/2fa/totp";
  }
}

export function getPasswordReset2FARedirect(user: BackendUser): string | undefined {
  if (user.registeredPasskey) {
    return "/auth/reset-password/2fa/passkey";
  }
  if (user.registeredSecurityKey) {
    return "/auth/reset-password/2fa/security-key";
  }
  if (user.registeredTOTP) {
    return "/auth/reset-password/2fa/totp";
  }
}
