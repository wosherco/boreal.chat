import { dev } from "$app/environment";
import {
  PREMIUM_PLAN_NAME,
  SUBSCRIPTION_PLANS,
  UNLIMITED_PLAN_NAME,
  type SubscriptionPlan,
} from "$lib/common";

// Premium Plan (6€/month)
const STRIPE_TEST_PREMIUM_PRICE_ID = "price_1RiIt4REiarlV7yiwQFEIvUo";
const STRIPE_TEST_PREMIUM_PRODUCT_ID = "prod_SclE79HKsObdzl";
const STRIPE_PROD_PREMIUM_PRICE_ID = "price_1RiItpI3L7BksYZyjrbL13lh";
const STRIPE_PROD_PREMIUM_PRODUCT_ID = "prod_Sda3QIdHsk6Bng";

// Unlimited Plan (12€/month)
const STRIPE_TEST_UNLIMITED_PRICE_ID = "price_1RiIuAREiarlV7yiR0hkEOcP";
const STRIPE_TEST_UNLIMITED_PRODUCT_ID = "prod_Sda4CenWlzQish";
const STRIPE_PROD_UNLIMITED_PRICE_ID = "price_1RiIuHI3L7BksYZyrhMAqZ8L";
const STRIPE_PROD_UNLIMITED_PRODUCT_ID = "prod_Sda4omLZRIaKab";

export { SUBSCRIPTION_PLANS, type SubscriptionPlan };

export const STRIPE_PLANS = {
  [PREMIUM_PLAN_NAME]: {
    priceId: dev ? STRIPE_TEST_PREMIUM_PRICE_ID : STRIPE_PROD_PREMIUM_PRICE_ID,
    productId: dev ? STRIPE_TEST_PREMIUM_PRODUCT_ID : STRIPE_PROD_PREMIUM_PRODUCT_ID,
    name: "Premium",
    price: 6,
  },
  [UNLIMITED_PLAN_NAME]: {
    priceId: dev ? STRIPE_TEST_UNLIMITED_PRICE_ID : STRIPE_PROD_UNLIMITED_PRICE_ID,
    productId: dev ? STRIPE_TEST_UNLIMITED_PRODUCT_ID : STRIPE_PROD_UNLIMITED_PRODUCT_ID,
    name: "Unlimited",
    price: 12,
  },
} as const;

// Credits system
const STRIPE_TEST_CREDITS_PRICE_ID = "price_1RiJlXREiarlV7yiMaKWDd3i";
const STRIPE_PROD_CREDITS_PRICE_ID = "price_1RiJlrI3L7BksYZyOwjev9GC";

export const STRIPE_CREDITS_PRICE_ID = dev
  ? STRIPE_TEST_CREDITS_PRICE_ID
  : STRIPE_PROD_CREDITS_PRICE_ID;
