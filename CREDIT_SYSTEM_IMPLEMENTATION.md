# Credit System Implementation

## Overview

A complete credit system has been implemented for the boreal.chat application. The system allows users to purchase credits for sending AI messages, with pricing of approximately 100 messages for 2.5€ (1 credit per message). The system fully integrates with Stripe for payments and supports coupon codes.

## Key Features

### 1. Credit Management
- **1 credit = 1 message** (100 messages ≈ 2.5€)
- Credits never expire
- Real-time credit balance tracking
- Transaction history with detailed records
- Support for purchase, usage, bonus, and refund transactions

### 2. Stripe Integration
- Complete Stripe checkout integration for credit purchases
- Webhook handling for successful payments
- Coupon code support for discounts
- Multiple credit packages with volume discounts:
  - 100 credits: €2.50 (no discount)
  - 500 credits: €12.00 (4% discount)
  - 1000 credits: €23.00 (8% discount)
  - 2500 credits: €55.00 (12% discount)

### 3. Billing Integration
- System respects `BILLING_ENABLED` flag
- Disabled when billing is disabled
- Unlimited usage for Pro subscribers
- Credits only required for non-subscribed users

### 4. User Interface
- Credit display in sidebar (compact view)
- Credit display on overview page
- Integrated billing page with tabs for subscriptions and credits
- Credit purchase component with package selection
- Transaction history display
- Low credit warnings (yellow at <10, red at <5)

### 5. Message System Integration
- Automatic credit deduction when sending messages
- Pre-send credit checking to prevent insufficient funds
- Error handling with buy credits call-to-action
- Integration with message creation, replies, and regeneration

## Database Schema Changes

### User Table Additions
```sql
-- Add credit fields to user table
ALTER TABLE "user" ADD COLUMN "credits" integer DEFAULT 0 NOT NULL;
ALTER TABLE "user" ADD COLUMN "totalCreditsEarned" integer DEFAULT 0 NOT NULL;
ALTER TABLE "user" ADD COLUMN "totalCreditsUsed" integer DEFAULT 0 NOT NULL;
```

### Credit Transaction Table
```sql
-- Create credit transaction table
CREATE TABLE "credit_transaction" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL,
  "type" varchar(50) NOT NULL CHECK ("type" IN ('purchase', 'usage', 'bonus', 'refund')),
  "amount" integer NOT NULL,
  "description" text NOT NULL,
  "messageId" uuid,
  "stripePaymentIntentId" text,
  "couponCode" text,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
```

## API Endpoints

### New Billing Routes
- `getCreditBalance` - Get user's current credit balance
- `getCreditTransactions` - Get user's transaction history
- `getCreditPackages` - Get available credit packages
- `createCreditCheckoutSession` - Create Stripe checkout for credits

## Components Created

### Credit System Components
1. **`CreditDisplay.svelte`** - Shows credit balance with warnings
2. **`CreditPurchase.svelte`** - Credit package selection and purchase
3. **Updated `BillingPage.svelte`** - Integrated credit management
4. **Updated `Sidebar.svelte`** - Compact credit display

## Service Layer

### Credit Service (`credits.ts`)
- `checkSufficientCredits()` - Verify user has enough credits
- `deductCreditsForMessage()` - Deduct credits for message usage
- `addCredits()` - Add credits for purchases/bonuses
- `getCreditBalance()` - Get user's credit information
- `getCreditTransactions()` - Get transaction history
- `calculateCreditsFromEuros()` / `calculateEurosFromCredits()` - Conversion utilities

## User Experience

### For Free Users
- Can purchase credits to send messages
- Credit balance visible in sidebar and overview
- Clear warnings when credits are low
- Prevented from sending messages without credits
- Easy purchase flow with Stripe checkout

### For Pro Subscribers
- Unlimited message usage (no credit deduction)
- Credit system disabled for subscribed users
- Can still view credit balance if they have credits

### Purchase Flow
1. User clicks "Buy Credits" or tries to send message without credits
2. Redirected to billing page with credit packages
3. Can enter coupon code for discounts
4. Stripe checkout with secure payment
5. Credits automatically added via webhook
6. Success page with confirmation
7. Immediate ability to use credits

## Configuration

### Stripe Products
Credit packages require Stripe products to be created with the following price IDs:
- Test: `price_test_credits_100`, `price_test_credits_500`, etc.
- Production: `price_prod_credits_100`, `price_prod_credits_500`, etc.

### Environment Variables
- `PUBLIC_BILLING_ENABLED` - Controls if credit system is active
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Webhook verification

## Security Features

- Server-side credit validation
- Stripe webhook verification
- Transaction integrity with database transactions
- Credit deduction only after successful message creation
- Protection against double-spending

## Monitoring & Analytics

- Complete transaction history
- Credit usage analytics through transaction records
- Stripe payment tracking
- Coupon code usage tracking

## Error Handling

- Insufficient credits prevention
- Failed payment handling
- Webhook failure recovery
- User-friendly error messages
- Automatic retry mechanisms where appropriate

## Testing Considerations

- Test mode Stripe integration
- Credit calculation accuracy
- Edge cases (0 credits, subscription changes)
- Webhook reliability
- UI responsiveness with credit updates

This implementation provides a complete, production-ready credit system that integrates seamlessly with the existing subscription model while providing flexible, pay-per-use pricing for non-subscribed users.