import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { userTable, creditTransactionTable } from "../db/schema";
import type { TransactableDBType } from "../db";
import { BILLING_ENABLED } from "$lib/common/constants";
import { isSubscribed } from "$lib/common/utils/subscription";

// Cost per message in credits (100 messages ≈ 2.5€, so 1 message ≈ 1 credit)
export const CREDITS_PER_MESSAGE = 1;
export const CREDITS_PER_EURO = 40; // 100 credits = 2.5€, so 40 credits per euro

export interface CreditBalance {
  credits: number;
  totalCreditsEarned: number;
  totalCreditsUsed: number;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  amount: number;
  description: string;
  messageId?: string;
  stripePaymentIntentId?: string;
  couponCode?: string;
  createdAt: Date;
}

/**
 * Check if user has sufficient credits for an action
 */
export async function checkSufficientCredits(
  userId: string,
  creditsNeeded: number = CREDITS_PER_MESSAGE
): Promise<boolean> {
  // If billing is disabled, allow unlimited usage
  if (!BILLING_ENABLED) {
    return true;
  }

  // Get user subscription status
  const [user] = await db
    .select({
      credits: userTable.credits,
      subscriptionStatus: userTable.subscriptionStatus,
      subscribedUntil: userTable.subscribedUntil,
    })
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!user) {
    return false;
  }

  // If user has active subscription, allow unlimited usage
  if (isSubscribed({ ...user, id: userId, name: '', email: '' })) {
    return true;
  }

  // Check if user has enough credits
  return user.credits >= creditsNeeded;
}

/**
 * Deduct credits for a message
 */
export async function deductCreditsForMessage(
  tx: TransactableDBType,
  userId: string,
  messageId: string,
  creditsToDeduct: number = CREDITS_PER_MESSAGE
): Promise<boolean> {
  // If billing is disabled, don't deduct credits
  if (!BILLING_ENABLED) {
    return true;
  }

  // Get user with subscription info
  const [user] = await tx
    .select({
      credits: userTable.credits,
      totalCreditsUsed: userTable.totalCreditsUsed,
      subscriptionStatus: userTable.subscriptionStatus,
      subscribedUntil: userTable.subscribedUntil,
    })
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!user) {
    throw new Error("User not found");
  }

  // If user has active subscription, don't deduct credits
  if (isSubscribed({ ...user, id: userId, name: '', email: '' })) {
    return true;
  }

  // Check if user has enough credits
  if (user.credits < creditsToDeduct) {
    return false;
  }

  // Deduct credits
  await tx
    .update(userTable)
    .set({
      credits: sql`${userTable.credits} - ${creditsToDeduct}`,
      totalCreditsUsed: sql`${userTable.totalCreditsUsed} + ${creditsToDeduct}`,
    })
    .where(eq(userTable.id, userId));

  // Record the transaction
  await tx.insert(creditTransactionTable).values({
    userId,
    type: "usage",
    amount: -creditsToDeduct,
    description: "Message sent",
    messageId,
  });

  return true;
}

/**
 * Add credits to user account (for purchases, bonuses, etc.)
 */
export async function addCredits(
  tx: TransactableDBType,
  userId: string,
  credits: number,
  type: 'purchase' | 'bonus' | 'refund',
  description: string,
  stripePaymentIntentId?: string,
  couponCode?: string
): Promise<void> {
  await tx
    .update(userTable)
    .set({
      credits: sql`${userTable.credits} + ${credits}`,
      totalCreditsEarned: sql`${userTable.totalCreditsEarned} + ${credits}`,
    })
    .where(eq(userTable.id, userId));

  // Record the transaction
  await tx.insert(creditTransactionTable).values({
    userId,
    type,
    amount: credits,
    description,
    stripePaymentIntentId,
    couponCode,
  });
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance | null> {
  const [user] = await db
    .select({
      credits: userTable.credits,
      totalCreditsEarned: userTable.totalCreditsEarned,
      totalCreditsUsed: userTable.totalCreditsUsed,
    })
    .from(userTable)
    .where(eq(userTable.id, userId));

  return user || null;
}

/**
 * Get user's credit transaction history
 */
export async function getCreditTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<CreditTransaction[]> {
  const transactions = await db
    .select()
    .from(creditTransactionTable)
    .where(eq(creditTransactionTable.userId, userId))
    .orderBy(sql`${creditTransactionTable.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  return transactions;
}

/**
 * Calculate credits needed for a number of euros
 */
export function calculateCreditsFromEuros(euros: number): number {
  return Math.round(euros * CREDITS_PER_EURO);
}

/**
 * Calculate euros from credits
 */
export function calculateEurosFromCredits(credits: number): number {
  return credits / CREDITS_PER_EURO;
}