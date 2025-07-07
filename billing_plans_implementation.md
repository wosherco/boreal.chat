# Billing Plans Implementation Summary

## Overview
Updated the billing system to support two new pricing plans:
- **Premium Plan**: 6€/month with usage-based AI requests and 20GB storage limit
- **Unlimited Plan**: 12€/month with unlimited AI requests and storage

## Changes Made

### 1. Frontend Changes

#### Updated Settings Layout (`src/routes/(settings)/settings/+layout.svelte`)
- **Full Width**: Removed `max-w-screen-lg` constraint for full-width layout
- **Full Height Sidebar**: Implemented flexbox layout with full-height sidebar
- **Responsive Widths**: 
  - Medium: `w-64` (256px)
  - Large: `w-72` (288px)  
  - 2XL: `w-80` (320px)
- **Better Content Flow**: Main content area uses `flex-1` for proper space utilization

#### Updated Pricing Plans (`src/lib/components/billing/BillingPage.svelte`)
- **Premium Plan (6€/month)**:
  - Usage-based AI requests
  - 20GB storage limit
  - Advanced web searching
  - Basic data analysis
  - Projects support
  - BYOK option
  
- **Unlimited Plan (12€/month)**:
  - Unlimited AI requests
  - Unlimited storage
  - Priority support
  - Projects with unlimited resources
  - Plus everything from Premium

### 2. Backend Changes

#### Common Types (`src/lib/common/index.ts`)
```typescript
export const SUBSCRIPTION_PLANS = ["premium", "unlimited"] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];
```

#### Stripe Constants (`src/lib/server/stripe/constants.ts`)
- **Multiple Plan Support**: Added separate price/product IDs for each plan
- **Plan Configuration Object**:
  ```typescript
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
  ```

#### Database Schema (`src/lib/server/db/schema/users.ts`)
- **New Column**: Added `subscriptionPlan` column to user table
- **Migration Generated**: `drizzle/0010_clean_leopardon.sql`
  ```sql
  ALTER TABLE "user" ADD COLUMN "subscription_plan" varchar(50);
  ```

#### Stripe Implementation (`src/lib/server/stripe/index.ts`)
- **Enhanced Checkout**: `createCheckoutSession()` now accepts plan parameter
- **Plan Detection**: Webhook determines plan type from product ID
- **Metadata Support**: Added plan information to checkout session metadata
- **Multi-Plan Webhook**: Updated `updateSubscriptionStatus()` to handle both plans

#### Billing Endpoints (`src/lib/server/orpc/routes/v1/billing.ts`)
- **Plan Parameter**: `createCheckoutSession` endpoint accepts plan selection
- **Input Validation**: Uses Zod schema with plan enum validation
- **Default Plan**: Defaults to "premium" plan if not specified

## Frontend Integration

The frontend now passes the selected plan when creating checkout sessions:

```typescript
// Premium plan
onclick={() => $createCheckoutSession.mutate({ plan: 'premium' })}

// Unlimited plan  
onclick={() => $createCheckoutSession.mutate({ plan: 'unlimited' })}
```

## Database Migration

Run the following to apply the database changes:
```bash
pnpm db:migrate
```

## Required Configuration

### Stripe Setup
You'll need to create the actual Stripe products and prices in your Stripe dashboard and update these placeholder IDs in `src/lib/server/stripe/constants.ts`:

**For Unlimited Plan (12€/month):**
- `STRIPE_TEST_UNLIMITED_PRICE_ID`: Replace `"price_test_unlimited_replace_me"`
- `STRIPE_TEST_UNLIMITED_PRODUCT_ID`: Replace `"prod_test_unlimited_replace_me"`  
- `STRIPE_PROD_UNLIMITED_PRICE_ID`: Replace `"price_prod_unlimited_replace_me"`
- `STRIPE_PROD_UNLIMITED_PRODUCT_ID`: Replace `"prod_prod_unlimited_replace_me"`

### Webhook Configuration
The existing Stripe webhook will automatically handle both plan types. No additional webhook configuration needed.

## Testing Checklist

- [ ] Settings layout displays full-width on larger screens
- [ ] Sidebar takes full height and proper responsive widths
- [ ] Premium plan checkout works with correct pricing
- [ ] Unlimited plan checkout works with correct pricing  
- [ ] Webhook properly detects and stores plan type
- [ ] User subscriptions display correct plan information
- [ ] Plan management through customer portal works
- [ ] Database migration applies successfully

## Next Steps

1. **Create Stripe Products**: Set up the actual Premium and Unlimited products in Stripe dashboard
2. **Update Price IDs**: Replace placeholder IDs with real Stripe price/product IDs
3. **Test End-to-End**: Complete subscription flow testing for both plans
4. **Monitor Webhooks**: Ensure webhook events properly update plan information
5. **User Experience**: Test the full user journey from plan selection to subscription management