import { dev } from "$app/environment";

const STRIPE_TEST_PRICE_ID = "price_1RhViVREiarlV7yiKm35WprI";
const STRIPE_TEST_PRODUCT_ID = "prod_SclE79HKsObdzl";
const STRIPE_PROD_PRICE_ID = "price_1Rhf74I3L7BksYZy7PVwyEY7";
const STRIPE_PROD_PRODUCT_ID = "prod_ScuweThN6Ztrg0";

export const STRIPE_PRICE_ID = dev ? STRIPE_TEST_PRICE_ID : STRIPE_PROD_PRICE_ID;
export const STRIPE_PRODUCT_ID = dev ? STRIPE_TEST_PRODUCT_ID : STRIPE_PROD_PRODUCT_ID;
