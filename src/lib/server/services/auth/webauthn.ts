import { db } from "$lib/server/db";
import {
  webauthnChallengeTable,
  passkeyCredentialTable,
  securityKeyCredentialTable,
} from "$lib/server/db/schema";
import { encodeHexLowerCase } from "@oslojs/encoding";
import { eq, and } from "drizzle-orm";

export interface WebAuthnUserCredential {
  id: Uint8Array;
  userId: string;
  name: string;
  algorithmId: number;
  publicKey: Uint8Array;
}

/**
 * Creates a WebAuthn challenge.
 * @param clientIp - The client IP address.
 * @returns The challenge.
 */
export async function createWebAuthnChallenge(clientIp: string): Promise<Uint8Array> {
  const challenge = new Uint8Array(20);
  crypto.getRandomValues(challenge);
  const encoded = encodeHexLowerCase(challenge);

  await db.insert(webauthnChallengeTable).values({
    challenge: encoded,
    clientIp,
    expiresAt: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes
  });

  return challenge;
}

/**
 * Verifies a WebAuthn challenge.
 * @param challenge - The challenge to verify.
 * @returns True if the challenge was verified, false otherwise.
 */
export async function verifyWebAuthnChallenge(challenge: Uint8Array): Promise<boolean> {
  const encoded = encodeHexLowerCase(challenge);

  const [deletedChallenge] = await db
    .delete(webauthnChallengeTable)
    .where(eq(webauthnChallengeTable.challenge, encoded))
    .returning();

  return !!deletedChallenge;
}

/**
 * Gets all passkey credentials for a user.
 * @param userId - The user ID.
 * @returns Array of passkey credentials.
 */
export async function getUserPasskeyCredentials(userId: string): Promise<WebAuthnUserCredential[]> {
  const rows = await db
    .select({
      id: passkeyCredentialTable.id,
      userId: passkeyCredentialTable.userId,
      name: passkeyCredentialTable.name,
      algorithm: passkeyCredentialTable.algorithm,
      publicKey: passkeyCredentialTable.publicKey,
    })
    .from(passkeyCredentialTable)
    .where(eq(passkeyCredentialTable.userId, userId));

  return rows.map((row) => ({
    id: Buffer.from(row.id),
    userId: row.userId,
    name: row.name,
    algorithmId: row.algorithm,
    publicKey: Buffer.from(row.publicKey),
  }));
}

/**
 * Gets a specific passkey credential by ID.
 * @param credentialId - The credential ID.
 * @returns The passkey credential or null if not found.
 */
export async function getPasskeyCredential(
  credentialId: Uint8Array,
): Promise<WebAuthnUserCredential | null> {
  const [row] = await db
    .select({
      id: passkeyCredentialTable.id,
      userId: passkeyCredentialTable.userId,
      name: passkeyCredentialTable.name,
      algorithm: passkeyCredentialTable.algorithm,
      publicKey: passkeyCredentialTable.publicKey,
    })
    .from(passkeyCredentialTable)
    .where(eq(passkeyCredentialTable.id, Buffer.from(credentialId)));

  if (!row) {
    return null;
  }

  return {
    id: Buffer.from(row.id),
    userId: row.userId,
    name: row.name,
    algorithmId: row.algorithm,
    publicKey: Buffer.from(row.publicKey),
  };
}

/**
 * Gets a specific passkey credential for a user.
 * @param userId - The user ID.
 * @param credentialId - The credential ID.
 * @returns The passkey credential or null if not found.
 */
export async function getUserPasskeyCredential(
  userId: string,
  credentialId: Uint8Array,
): Promise<WebAuthnUserCredential | null> {
  const [row] = await db
    .select({
      id: passkeyCredentialTable.id,
      userId: passkeyCredentialTable.userId,
      name: passkeyCredentialTable.name,
      algorithm: passkeyCredentialTable.algorithm,
      publicKey: passkeyCredentialTable.publicKey,
    })
    .from(passkeyCredentialTable)
    .where(
      and(
        eq(passkeyCredentialTable.id, Buffer.from(credentialId)),
        eq(passkeyCredentialTable.userId, userId),
      ),
    );

  if (!row) {
    return null;
  }

  return {
    id: Buffer.from(row.id),
    userId: row.userId,
    name: row.name,
    algorithmId: row.algorithm,
    publicKey: Buffer.from(row.publicKey),
  };
}

/**
 * Creates a new passkey credential.
 * @param credential - The credential to create.
 */
export async function createPasskeyCredential(credential: WebAuthnUserCredential): Promise<void> {
  await db.insert(passkeyCredentialTable).values({
    id: Buffer.from(credential.id),
    userId: credential.userId,
    name: credential.name,
    algorithm: credential.algorithmId,
    publicKey: Buffer.from(credential.publicKey),
  });
}

/**
 * Deletes a passkey credential for a user.
 * @param userId - The user ID.
 * @param credentialId - The credential ID.
 * @returns True if the credential was deleted, false otherwise.
 */
export async function deleteUserPasskeyCredential(
  userId: string,
  credentialId: Uint8Array,
): Promise<boolean> {
  const [deletedCredential] = await db
    .delete(passkeyCredentialTable)
    .where(
      and(
        eq(passkeyCredentialTable.id, Buffer.from(credentialId)),
        eq(passkeyCredentialTable.userId, userId),
      ),
    )
    .returning();

  return !!deletedCredential;
}

/**
 * Gets all security key credentials for a user.
 * @param userId - The user ID.
 * @returns Array of security key credentials.
 */
export async function getUserSecurityKeyCredentials(
  userId: string,
): Promise<WebAuthnUserCredential[]> {
  const rows = await db
    .select({
      id: securityKeyCredentialTable.id,
      userId: securityKeyCredentialTable.userId,
      name: securityKeyCredentialTable.name,
      algorithm: securityKeyCredentialTable.algorithm,
      publicKey: securityKeyCredentialTable.publicKey,
    })
    .from(securityKeyCredentialTable)
    .where(eq(securityKeyCredentialTable.userId, userId));

  return rows.map((row) => ({
    id: Buffer.from(row.id),
    userId: row.userId,
    name: row.name,
    algorithmId: row.algorithm,
    publicKey: Buffer.from(row.publicKey),
  }));
}

/**
 * Gets a specific security key credential for a user.
 * @param userId - The user ID.
 * @param credentialId - The credential ID.
 * @returns The security key credential or null if not found.
 */
export async function getUserSecurityKeyCredential(
  userId: string,
  credentialId: Uint8Array,
): Promise<WebAuthnUserCredential | null> {
  const [row] = await db
    .select({
      id: securityKeyCredentialTable.id,
      userId: securityKeyCredentialTable.userId,
      name: securityKeyCredentialTable.name,
      algorithm: securityKeyCredentialTable.algorithm,
      publicKey: securityKeyCredentialTable.publicKey,
    })
    .from(securityKeyCredentialTable)
    .where(
      and(
        eq(securityKeyCredentialTable.id, Buffer.from(credentialId)),
        eq(securityKeyCredentialTable.userId, userId),
      ),
    );

  if (!row) {
    return null;
  }

  return {
    id: Buffer.from(row.id),
    userId: row.userId,
    name: row.name,
    algorithmId: row.algorithm,
    publicKey: Buffer.from(row.publicKey),
  };
}

/**
 * Creates a new security key credential.
 * @param credential - The credential to create.
 */
export async function createSecurityKeyCredential(
  credential: WebAuthnUserCredential,
): Promise<void> {
  await db.insert(securityKeyCredentialTable).values({
    id: Buffer.from(credential.id),
    userId: credential.userId,
    name: credential.name,
    algorithm: credential.algorithmId,
    publicKey: Buffer.from(credential.publicKey),
  });
}

/**
 * Deletes a security key credential for a user.
 * @param userId - The user ID.
 * @param credentialId - The credential ID.
 * @returns True if the credential was deleted, false otherwise.
 */
export async function deleteUserSecurityKeyCredential(
  userId: string,
  credentialId: Uint8Array,
): Promise<boolean> {
  const [deletedCredential] = await db
    .delete(securityKeyCredentialTable)
    .where(
      and(
        eq(securityKeyCredentialTable.id, Buffer.from(credentialId)),
        eq(securityKeyCredentialTable.userId, userId),
      ),
    )
    .returning();

  return !!deletedCredential;
}
