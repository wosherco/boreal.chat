import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { BILLING_ENABLED } from "$lib/common/constants";
import Stripe from "stripe";
import { userTable, paymentMethodsTable, creditsTable, creditTransactionsTable } from "../db/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import * as Sentry from "@sentry/sveltekit";

function createStripe() {
  if (!BILLING_ENABLED) {
    return null;
  }

  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  return new Stripe(env.STRIPE_SECRET_KEY);
}

async function ensureCustomerId(stripe: Stripe, userId: string) {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .select({
        id: userTable.id,
        name: userTable.name,
        stripeCustomerId: userTable.stripeCustomerId,
        email: userTable.email,
      })
      .from(userTable)
      .where(eq(userTable.id, userId));

    if (!user) {
      throw new Error("User not found");
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });

      try {
        await tx
          .update(userTable)
          .set({ stripeCustomerId: customer.id })
          .where(eq(userTable.id, userId));
      } catch (err) {
        await stripe.customers.del(customer.id);
        throw err;
      }

      customerId = customer.id;
    }

    return { customerId };
  });
}



export async function handleStripeWebhook(req: Request): Promise<Response> {
  const stripe = createStripe();

  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe is not enabled", { status: 403 });
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("stripe-signature is not set", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    Sentry.captureException(err, {
      tags: {
        webhook: "stripe",
      },
    });
    console.error(err);
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  // Handle the event
  let paymentIntent: Stripe.PaymentIntent | null = null;

  switch (event.type) {
    case "payment_intent.succeeded":
      paymentIntent = event.data.object;
      break;
    case "payment_intent.payment_failed":
      paymentIntent = event.data.object;
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  if (paymentIntent && paymentIntent.metadata.userId) {
    await handleCreditPaymentIntent(paymentIntent);
  }

  return new Response("OK");
}



async function handleCreditPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata.userId;
  const creditAmount = parseFloat(paymentIntent.metadata.creditAmount);
  
  if (paymentIntent.status === 'succeeded') {
    await db.transaction(async (tx) => {
      // Update transaction status
      await tx
        .update(creditTransactionsTable)
        .set({ 
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(creditTransactionsTable.stripePaymentIntentId, paymentIntent.id));
      
      // Add credits to user account  
      const [currentUser] = await tx
        .select({ credits: userTable.credits })
        .from(userTable)
        .where(eq(userTable.id, userId));
      
      const currentCredits = parseFloat(currentUser?.credits || "0");
      const newCredits = currentCredits + creditAmount;
      
      await tx
        .update(userTable)
        .set({ 
          credits: newCredits.toString(),
        })
        .where(eq(userTable.id, userId));
      
      // Record credit entry
      await tx.insert(creditsTable).values({
        userId,
        amount: creditAmount.toString(),
        description: `Credit purchase - $${creditAmount}`,
        type: 'purchase',
        stripePaymentIntentId: paymentIntent.id,
      });
    });
  } else if (paymentIntent.status === 'payment_failed') {
    // Update transaction status to failed
    await db
      .update(creditTransactionsTable)
      .set({ 
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(creditTransactionsTable.stripePaymentIntentId, paymentIntent.id));
  }
}

// New credit-related functions
export async function createPaymentMethod(userId: string, paymentMethodId: string) {
  const stripe = createStripe();
  if (!stripe) return null;

  const { customerId } = await ensureCustomerId(stripe, userId);
  
  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // Get payment method details
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  
  // Store in database
  const [newPaymentMethod] = await db.insert(paymentMethodsTable).values({
    userId,
    stripePaymentMethodId: paymentMethodId,
    type: paymentMethod.type,
    last4: paymentMethod.card?.last4 || null,
    brand: paymentMethod.card?.brand || null,
    expiryMonth: paymentMethod.card?.exp_month?.toString() || null,
    expiryYear: paymentMethod.card?.exp_year?.toString() || null,
  }).returning();

  return newPaymentMethod;
}

export async function getUserPaymentMethods(userId: string) {
  return await db.select().from(paymentMethodsTable).where(eq(paymentMethodsTable.userId, userId));
}

export async function setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
  return await db.transaction(async (tx) => {
    // Remove default from all user's payment methods
    await tx
      .update(paymentMethodsTable)
      .set({ isDefault: false })
      .where(eq(paymentMethodsTable.userId, userId));
    
    // Set the selected one as default
    await tx
      .update(paymentMethodsTable)
      .set({ isDefault: true })
      .where(eq(paymentMethodsTable.id, paymentMethodId));
  });
}

export async function deletePaymentMethod(userId: string, paymentMethodId: string) {
  const stripe = createStripe();
  if (!stripe) return null;

  const [paymentMethod] = await db
    .select()
    .from(paymentMethodsTable)
    .where(eq(paymentMethodsTable.id, paymentMethodId));

  if (!paymentMethod || paymentMethod.userId !== userId) {
    throw new Error("Payment method not found or unauthorized");
  }

  // Detach from Stripe
  await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);
  
  // Delete from database
  await db.delete(paymentMethodsTable).where(eq(paymentMethodsTable.id, paymentMethodId));
  
  return true;
}

export async function createCreditPurchase(
  userId: string,
  amount: number,
  paymentMethodId?: string,
  isOneTime: boolean = true
) {
  const stripe = createStripe();
  if (!stripe) return null;

  if (amount < 5) {
    throw new Error("Minimum purchase amount is $5");
  }

  const fee = Math.round(amount * 8) / 100; // 8% fee, rounded to cents
  const totalAmount = amount + fee;

  const { customerId } = await ensureCustomerId(stripe, userId);

  let paymentMethodStripeId: string | undefined;
  
  if (paymentMethodId) {
    const [paymentMethod] = await db
      .select()
      .from(paymentMethodsTable)
      .where(eq(paymentMethodsTable.id, paymentMethodId));
    
    if (!paymentMethod || paymentMethod.userId !== userId) {
      throw new Error("Payment method not found or unauthorized");
    }
    
    paymentMethodStripeId = paymentMethod.stripePaymentMethodId;
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100), // Convert to cents
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodStripeId,
    confirmation_method: 'manual',
    confirm: false,
    metadata: {
      userId,
      creditAmount: amount.toString(),
      fee: fee.toString(),
      isOneTime: isOneTime.toString(),
    },
  });

  // Store transaction in database
  const [transaction] = await db.insert(creditTransactionsTable).values({
    userId,
    amount: amount.toString(),
    fee: fee.toString(),
    totalAmount: totalAmount.toString(),
    paymentMethodId: paymentMethodId || null,
    stripePaymentIntentId: paymentIntent.id,
    status: 'pending',
    isOneTime,
  }).returning();

  return {
    clientSecret: paymentIntent.client_secret,
    transaction,
  };
}

export async function confirmCreditPurchase(paymentIntentId: string) {
  const stripe = createStripe();
  if (!stripe) return null;

  const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
  
  if (paymentIntent.status === 'succeeded') {
    const userId = paymentIntent.metadata.userId;
    const creditAmount = parseFloat(paymentIntent.metadata.creditAmount);
    
    await db.transaction(async (tx) => {
      // Update transaction status
      await tx
        .update(creditTransactionsTable)
        .set({ 
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(creditTransactionsTable.stripePaymentIntentId, paymentIntentId));
      
      // Add credits to user account  
      const [currentUser] = await tx
        .select({ credits: userTable.credits })
        .from(userTable)
        .where(eq(userTable.id, userId));
      
      const currentCredits = parseFloat(currentUser?.credits || "0");
      const newCredits = currentCredits + creditAmount;
      
      await tx
        .update(userTable)
        .set({ 
          credits: newCredits.toString(),
        })
        .where(eq(userTable.id, userId));
      
      // Record credit entry
      await tx.insert(creditsTable).values({
        userId,
        amount: creditAmount.toString(),
        description: `Credit purchase - $${creditAmount}`,
        type: 'purchase',
        stripePaymentIntentId: paymentIntentId,
      });
    });
  }
  
  return paymentIntent;
}

export async function getUserCredits(userId: string) {
  const [user] = await db
    .select({ credits: userTable.credits })
    .from(userTable)
    .where(eq(userTable.id, userId));
  
  return user?.credits || "0.00";
}

export async function getUserCreditHistory(userId: string) {
  return await db
    .select()
    .from(creditsTable)
    .where(eq(creditsTable.userId, userId))
    .orderBy(desc(creditsTable.createdAt));
}
