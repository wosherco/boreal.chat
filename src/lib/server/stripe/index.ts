import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { BILLING_ENABLED } from "$lib/common/constants";
import { type SubscriptionPlan } from "$lib/common";
import Stripe from "stripe";
import { userTable } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { STRIPE_PLANS, STRIPE_PRICE_ID, STRIPE_PRODUCT_ID } from "./constants";
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

    return customerId;
  });
}

export async function createCheckoutSession(userId: string, plan: SubscriptionPlan = "premium") {
  const stripe = createStripe();

  if (!stripe) {
    return null;
  }

  const planConfig = STRIPE_PLANS[plan];
  if (!planConfig) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  const customerId = await ensureCustomerId(stripe, userId);

  return stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: planConfig.priceId,
        quantity: 1,
      },
    ],
    customer: customerId,
    allow_promotion_codes: true,
    metadata: {
      plan: plan,
    },
    // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
    // the actual Session ID is returned in the query parameter when your customer
    // is redirected to the success page.
    success_url: `${publicEnv.PUBLIC_URL}/settings/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${publicEnv.PUBLIC_URL}/settings/billing/canceled`,
  });
}

export async function createCustomerSession(userId: string, toCancel = false) {
  const stripe = createStripe();

  if (!stripe) {
    return null;
  }

  const customerId = await ensureCustomerId(stripe, userId);

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${publicEnv.PUBLIC_URL}/settings/billing`,
    flow_data: toCancel
      ? {
          type: "subscription_cancel",
        }
      : undefined,
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
  let subscription: Stripe.Subscription | null = null;

  // TODO: Add posthog events
  switch (event.type) {
    case "customer.subscription.trial_will_end":
      subscription = event.data.object;
      break;
    case "customer.subscription.deleted":
      subscription = event.data.object;
      break;
    case "customer.subscription.created":
      subscription = event.data.object;
      break;
    case "customer.subscription.updated":
      subscription = event.data.object;
      break;
    // case "entitlements.active_entitlement_summary.updated":
    //   subscription = event.data.object;
    //   break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }

  if (subscription) {
    await updateSubscriptionStatus(subscription);
  }

  return new Response("OK");
}

async function updateSubscriptionStatus(subscription: Stripe.Subscription) {
  const status = subscription.status;
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;

  if (!customerId) {
    return;
  }

  // Determine which plan this subscription is for
  let subscriptionPlan: SubscriptionPlan | null = null;
  let productItem: Stripe.SubscriptionItem | null = null;

  for (const item of subscription.items.data) {
    const product = item.price?.product;
    if (!product || item.object !== "subscription_item" || !item.current_period_end) {
      continue;
    }
    
    const productId = typeof product === "string" ? product : product?.id;
    
    // Check which plan this product belongs to
    for (const [planKey, planConfig] of Object.entries(STRIPE_PLANS)) {
      if (productId === planConfig.productId) {
        subscriptionPlan = planKey as SubscriptionPlan;
        productItem = item;
        break;
      }
    }
    
    if (subscriptionPlan && productItem) {
      break;
    }
  }

  if (!productItem || !subscriptionPlan) {
    console.warn("No matching product found for subscription", subscription.id);
    return;
  }

  const subscriptionEnd = new Date(productItem.current_period_end * 1000);

  await db
    .update(userTable)
    .set({
      subscriptionStatus: status,
      subscriptionPlan: subscriptionPlan,
      subscribedUntil: subscriptionEnd,
      subscriptionId: subscription.id,
    })
    .where(eq(userTable.stripeCustomerId, customerId));
}
