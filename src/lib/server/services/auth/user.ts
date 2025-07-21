import { db } from "$lib/server/db";
import {
  userTable,
  passkeyCredentialTable,
  securityKeyCredentialTable,
  totpCredentialTable,
} from "$lib/server/db/schema";
import { hashPassword } from "./password";
import { encryptString, decryptToString } from "./encryption";
import { eq, and, sql, SQL } from "drizzle-orm";
import { generateRandomRecoveryCode } from "./utils";

export interface BackendUser {
  id: string;
  email: string;
  passwordHash: string | null;
  emailVerified: boolean;
  registeredTOTP: boolean;
  registeredSecurityKey: boolean;
  registeredPasskey: boolean;
  registered2FA: boolean;
}

/**
 * Validates username input.
 * @param username - The username to validate.
 * @returns True if the username is valid, false otherwise.
 */
export function verifyUsernameInput(username: string): boolean {
  return username.length > 3 && username.length < 32 && username.trim() === username;
}

export class UserAlreadyExistsError extends Error {
  constructor() {
    super("User already exists");
    this.name = "UserAlreadyExistsError";
  }
}

/**
 * Creates a new user.
 * @param email - The user's email address.
 * @param name - The user's name.
 * @param password - The user's password.
 * @returns The created user.
 */
export async function createUser(
  email: string,
  name: string,
  password: string,
): Promise<BackendUser> {
  const passwordHash = await hashPassword(password);
  const recoveryCode = generateRandomRecoveryCode();
  const encryptedRecoveryCode = encryptString(recoveryCode);

  const [user] = await db
    .insert(userTable)
    .values({
      email,
      name,
      passwordHash,
      recoveryCode: Buffer.from(encryptedRecoveryCode),
    })
    .onConflictDoNothing()
    .returning();

  if (!user) {
    throw new UserAlreadyExistsError();
  }

  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    emailVerified: user.emailVerified,
    registeredTOTP: false,
    registeredPasskey: false,
    registeredSecurityKey: false,
    registered2FA: false,
  };
}

/**
 * Updates a user's email and marks it as verified.
 * @param userId - The user ID.
 * @param email - The new email address.
 */
export async function updateUserEmailAndSetEmailAsVerified(
  userId: string,
  email: string,
): Promise<void> {
  await db.update(userTable).set({ email, emailVerified: true }).where(eq(userTable.id, userId));
}

/**
 * Sets a user's email as verified if it matches the provided email.
 * @param userId - The user ID.
 * @param email - The email to verify.
 * @returns True if the email was verified, false otherwise.
 */
export async function setUserAsEmailVerifiedIfEmailMatches(
  userId: string,
  email: string,
): Promise<boolean> {
  const [result] = await db
    .update(userTable)
    .set({ emailVerified: true })
    .where(and(eq(userTable.id, userId), eq(userTable.email, email)))
    .returning();

  return !!result;
}

/**
 * Gets a user's recovery code.
 * @param userId - The user ID.
 * @returns The decrypted recovery code.
 */
export async function getUserRecoverCode(userId: string): Promise<string> {
  const [user] = await db
    .select({ recoveryCode: userTable.recoveryCode })
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!user || !user.recoveryCode) {
    throw new Error("Invalid user ID or no recovery code set");
  }

  return decryptToString(user.recoveryCode);
}

/**
 * Resets a user's recovery code.
 * @param userId - The user ID.
 * @returns The new recovery code.
 */
export async function resetUserRecoveryCode(userId: string): Promise<string> {
  const recoveryCode = generateRandomRecoveryCode();
  const encrypted = encryptString(recoveryCode);

  await db
    .update(userTable)
    .set({ recoveryCode: Buffer.from(encrypted) })
    .where(eq(userTable.id, userId));

  return recoveryCode;
}

async function getUser(where: SQL<unknown>): Promise<BackendUser | null> {
  const [user] = await db
    .select({
      id: userTable.id,
      email: userTable.email,
      passwordHash: userTable.passwordHash,
      emailVerified: userTable.emailVerified,
      totpCredential: sql<boolean>`${totpCredentialTable.id} IS NOT NULL`,
      passkeyCredential: sql<boolean>`${passkeyCredentialTable.id} IS NOT NULL`,
      securityKeyCredential: sql<boolean>`${securityKeyCredentialTable.id} IS NOT NULL`,
    })
    .from(userTable)
    .leftJoin(totpCredentialTable, eq(userTable.id, totpCredentialTable.userId))
    .leftJoin(passkeyCredentialTable, eq(userTable.id, passkeyCredentialTable.userId))
    .leftJoin(securityKeyCredentialTable, eq(userTable.id, securityKeyCredentialTable.userId))
    .where(where);

  if (!user) {
    return null;
  }

  const registered2FA = user.totpCredential || user.passkeyCredential || user.securityKeyCredential;

  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    emailVerified: user.emailVerified,
    registeredTOTP: user.totpCredential,
    registeredPasskey: user.passkeyCredential,
    registeredSecurityKey: user.securityKeyCredential,
    registered2FA,
  };
}

/**
 * Gets a user by email address.
 * @param email - The email address.
 * @returns The user or null if not found.
 */
export async function getUserByEmail(email: string): Promise<BackendUser | null> {
  return getUser(eq(userTable.email, email));
}

/**
 * Gets a user by ID.
 * @param userId - The user ID.
 * @returns The user or null if not found.
 */
export async function getUserById(userId: string): Promise<BackendUser | null> {
  return getUser(eq(userTable.id, userId));
}

/**
 * Updates a user's password.
 * @param userId - The user ID.
 * @param password - The new password.
 */
export async function updateUserPassword(userId: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  await db.update(userTable).set({ passwordHash }).where(eq(userTable.id, userId));
}

/**
 * Gets a user's password hash.
 * @param userId - The user ID.
 * @returns The password hash.
 */
export async function getUserPasswordHash(userId: string): Promise<string> {
  const [user] = await db
    .select({ passwordHash: userTable.passwordHash })
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!user || !user.passwordHash) {
    throw new Error("Invalid user ID or no password set");
  }

  return user.passwordHash;
}
