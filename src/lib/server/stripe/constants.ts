import { dev } from "$app/environment";
import { SUBSCRIPTION_PLANS, UNLIMITED_PLAN_NAME, type SubscriptionPlan } from "$lib/common";

// Unlimited Plan (10/month)
const STRIPE_TEST_UNLIMITED_PRICE_ID = "price_1RiIuAREiarlV7yiR0hkEOcP";
const STRIPE_TEST_UNLIMITED_PRODUCT_ID = "prod_Sda4CenWlzQish";
const STRIPE_PROD_UNLIMITED_PRICE_ID = "price_1RiiV0I3L7BksYZyK5mUMr3Q";
const STRIPE_PROD_UNLIMITED_PRODUCT_ID = "prod_Sda4omLZRIaKab";

export { SUBSCRIPTION_PLANS, type SubscriptionPlan };

export const STRIPE_PLANS = {
  [UNLIMITED_PLAN_NAME]: {
    priceId: dev ? STRIPE_TEST_UNLIMITED_PRICE_ID : STRIPE_PROD_UNLIMITED_PRICE_ID,
    productId: dev ? STRIPE_TEST_UNLIMITED_PRODUCT_ID : STRIPE_PROD_UNLIMITED_PRODUCT_ID,
    name: "Unlimited",
    price: 10,
  },
} as const;
