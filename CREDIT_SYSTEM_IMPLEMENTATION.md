# Credit System Implementation

## Overview
Replaced the legacy Stripe subscription system with a modern credit-based payment system, allowing users to purchase credits for pay-as-you-go usage.

## Database Schema Changes

### New Tables Added
1. **`payment_methods`** - Stores user's saved payment methods
   - Links to Stripe payment method IDs
   - Stores display info (last4, brand, expiry)
   - Supports default payment method selection

2. **`credits`** - Credit ledger for tracking all credit transactions
   - Purchase, usage, refund, and bonus entries
   - Links to Stripe payment intents

3. **`credit_transactions`** - Detailed transaction records
   - Tracks amounts, fees (8%), and payment methods used
   - Supports one-time payment flag
   - Status tracking (pending, completed, failed, refunded)

### User Table Updates
- **Added**: `credits` field (decimal) to track current balance
- **Removed**: All subscription-related fields (`subscriptionId`, `subscriptionPlan`, `subscribedUntil`, `subscriptionStatus`)
- **Kept**: `stripeCustomerId` for payment method management

## Backend Implementation

### Stripe Service Functions (`src/lib/server/stripe/index.ts`)
- **Payment Method Management**:
  - `createPaymentMethod()` - Add and attach payment methods to customers
  - `getUserPaymentMethods()` - Retrieve user's saved payment methods
  - `setDefaultPaymentMethod()` - Set default payment method
  - `deletePaymentMethod()` - Remove payment methods

- **Credit Purchase Flow**:
  - `createCreditPurchase()` - Creates Stripe payment intent with 8% fee calculation
  - `confirmCreditPurchase()` - Processes successful payments
  - `getUserCredits()` - Get current credit balance
  - `getUserCreditHistory()` - Get credit transaction history

- **Webhook Handling**:
  - Simplified to only handle `payment_intent.succeeded` and `payment_intent.payment_failed` events
  - `handleCreditPaymentIntent()` - Processes webhook events for credit purchases

- **Removed Functions**:
  - All subscription-related functions (`createCheckoutSession`, `createCustomerSession`, `createUpgradeSession`, `updateSubscriptionStatus`)

### API Routes (`src/lib/server/orpc/routes/v1/billing.ts`)
Clean credit-only billing router with endpoints:
- `addPaymentMethod` - Add payment method
- `getPaymentMethods` - List user's payment methods  
- `setDefaultPaymentMethod` - Set default payment method
- `deletePaymentMethod` - Remove payment method
- `createCreditPurchase` - Initialize credit purchase
- `confirmCreditPurchase` - Confirm payment
- `getUserCredits` - Get current balance
- `getCreditHistory` - Get transaction history

**Removed**: All subscription-related endpoints

## Frontend Implementation

### Components
1. **`CreditPurchase.svelte`** - Main credit purchase component featuring:
   - Real-time fee calculation (8%)
   - Stripe Elements integration for card input
   - Payment method selection (new card vs saved methods)
   - One-time payment toggle
   - Saved payment method management
   - Current credit balance display

2. **`Switch.svelte`** - Custom switch component for UI controls

### Updated Billing Page
- **`BillingPage.svelte`** simplified to focus only on credits:
  - Removed subscription tabs and plans
  - Clean credit-focused interface
  - Integrated payment method management

### Navigation Updates
- Settings menu label changed from "Billing" to "Credits"
- Page titles updated to reflect credit system

## Key Features

### Credit Purchase Flow
1. User enters amount (minimum $5)
2. System calculates 8% processing fee
3. User selects payment method (new card or saved)
4. Stripe Elements handles secure card input
5. Payment intent created with metadata
6. Real-time payment confirmation
7. Credits added to user account via webhook

### Payment Method Management
- Save payment methods for future use
- Multiple payment methods support
- Default payment method selection
- Secure deletion of payment methods

## Technical Details

### Security
- All payment processing via Stripe's secure infrastructure
- Payment method tokens stored, never raw card data
- Webhook signature verification for event authenticity
- User authorization on all endpoints

### Error Handling
- Comprehensive error states in UI
- Transaction status tracking in database
- Failed payment handling via webhooks
- User-friendly error messages

### Database Integrity
- Transactional credit updates
- Foreign key constraints
- Atomic operations for payment processing

## Dependencies Added
- `@stripe/stripe-js` - Frontend Stripe Elements integration

## Files Removed
- `src/lib/server/stripe/constants.ts` - Subscription plan constants no longer needed

## Environment Variables Required
- `PUBLIC_STRIPE_PUBLISHABLE_KEY` - Frontend Stripe key
- Existing Stripe server variables remain unchanged

## Migration Notes
- New database tables need to be generated (not run as requested)
- **Breaking changes**: Subscription functionality completely removed
- Users will need to transition to credit-based system
- Existing `stripeCustomerId` preserved for payment method continuity