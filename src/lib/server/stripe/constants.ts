import { dev } from "$app/environment";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "$lib/common";

// Premium Plan (6€/month)
const STRIPE_TEST_PREMIUM_PRICE_ID = "price_1RhViVREiarlV7yiKm35WprI";
const STRIPE_TEST_PREMIUM_PRODUCT_ID = "prod_SclE79HKsObdzl";
const STRIPE_PROD_PREMIUM_PRICE_ID = "price_1Rhf74I3L7BksYZy7PVwyEY7";
const STRIPE_PROD_PREMIUM_PRODUCT_ID = "prod_ScuweThN6Ztrg0";

// Unlimited Plan (12€/month)
const STRIPE_TEST_UNLIMITED_PRICE_ID = "price_test_unlimited_replace_me";
const STRIPE_TEST_UNLIMITED_PRODUCT_ID = "prod_test_unlimited_replace_me";
const STRIPE_PROD_UNLIMITED_PRICE_ID = "price_prod_unlimited_replace_me";
const STRIPE_PROD_UNLIMITED_PRODUCT_ID = "prod_prod_unlimited_replace_me";

export { SUBSCRIPTION_PLANS, type SubscriptionPlan };

export const STRIPE_PLANS = {
  premium: {
    priceId: dev ? STRIPE_TEST_PREMIUM_PRICE_ID : STRIPE_PROD_PREMIUM_PRICE_ID,
    productId: dev ? STRIPE_TEST_PREMIUM_PRODUCT_ID : STRIPE_PROD_PREMIUM_PRODUCT_ID,
    name: "Premium",
    price: 6,
  },
  unlimited: {
    priceId: dev ? STRIPE_TEST_UNLIMITED_PRICE_ID : STRIPE_PROD_UNLIMITED_PRICE_ID,
    productId: dev ? STRIPE_TEST_UNLIMITED_PRODUCT_ID : STRIPE_PROD_UNLIMITED_PRODUCT_ID,
    name: "Unlimited",
    price: 12,
  },
} as const;

// Legacy exports for backward compatibility
export const STRIPE_PRICE_ID = STRIPE_PLANS.premium.priceId;
export const STRIPE_PRODUCT_ID = STRIPE_PLANS.premium.productId;
