import { dev } from "$app/environment";

// Subscription products
const STRIPE_TEST_PRICE_ID = "price_1RhViVREiarlV7yiKm35WprI";
const STRIPE_TEST_PRODUCT_ID = "prod_SclE79HKsObdzl";
const STRIPE_PROD_PRICE_ID = "price_1Rhf74I3L7BksYZy7PVwyEY7";
const STRIPE_PROD_PRODUCT_ID = "prod_ScuweThN6Ztrg0";

export const STRIPE_PRICE_ID = dev ? STRIPE_TEST_PRICE_ID : STRIPE_PROD_PRICE_ID;
export const STRIPE_PRODUCT_ID = dev ? STRIPE_TEST_PRODUCT_ID : STRIPE_PROD_PRODUCT_ID;

// Credit packages (one-time payments)
// Note: Replace these with actual Stripe price IDs when you create them in your Stripe dashboard
const STRIPE_CREDITS_TEST_PRICES = {
  credits_100: "price_test_credits_100", // 100 credits for 2.5€
  credits_500: "price_test_credits_500", // 500 credits for 12€ (4% discount)
  credits_1000: "price_test_credits_1000", // 1000 credits for 23€ (8% discount)
  credits_2500: "price_test_credits_2500", // 2500 credits for 55€ (12% discount)
};

const STRIPE_CREDITS_PROD_PRICES = {
  credits_100: "price_prod_credits_100",
  credits_500: "price_prod_credits_500", 
  credits_1000: "price_prod_credits_1000",
  credits_2500: "price_prod_credits_2500",
};

export const STRIPE_CREDIT_PRICES = dev ? STRIPE_CREDITS_TEST_PRICES : STRIPE_CREDITS_PROD_PRICES;

// Credit package definitions
export const CREDIT_PACKAGES = [
  {
    id: "credits_100",
    credits: 100,
    priceEuros: 2.5,
    priceId: STRIPE_CREDIT_PRICES.credits_100,
    popular: false,
    discount: 0,
  },
  {
    id: "credits_500", 
    credits: 500,
    priceEuros: 12,
    priceId: STRIPE_CREDIT_PRICES.credits_500,
    popular: true,
    discount: 4,
  },
  {
    id: "credits_1000",
    credits: 1000,
    priceEuros: 23,
    priceId: STRIPE_CREDIT_PRICES.credits_1000,
    popular: false,
    discount: 8,
  },
  {
    id: "credits_2500",
    credits: 2500,
    priceEuros: 55,
    priceId: STRIPE_CREDIT_PRICES.credits_2500,
    popular: false,
    discount: 12,
  },
];
