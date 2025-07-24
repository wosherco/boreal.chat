import { isFuture } from "date-fns";
import { type SubscriptionStatus, UNLIMITED_PLAN_NAME, FREE_PLAN_NAME } from "..";
import { BILLING_ENABLED } from "../constants";
import type { UserInfo } from "../sharedTypes";

export function isSubscribed(user: UserInfo | null, bypassBillingDisabled = true) {
  if (!BILLING_ENABLED && bypassBillingDisabled) {
    return true;
  }

  if (!user?.subscribedUntil || !user.subscriptionStatus) {
    return false;
  }

  return isFuture(user.subscribedUntil) && isActiveSubscriptionStatus(user.subscriptionStatus);
}

export function hasUnlimitedAccess(user: UserInfo | null) {
  if (!BILLING_ENABLED) {
    return true;
  }

  return isSubscribed(user) && user?.subscriptionPlan === UNLIMITED_PLAN_NAME;
}

export function hasFreePlanAccess(user: UserInfo | null) {
  if (!user) {
    return false;
  }

  // Free plan users are either explicitly on free plan or users without any subscription
  return user.subscriptionPlan === FREE_PLAN_NAME || 
         (!user.subscriptionPlan && !isSubscribed(user));
}

export function isAnonymousUser(user: UserInfo | null) {
  // Check if user exists and has anonymous flag set to true
  // Note: You'll need to add the anonymous field to UserInfo type
  return user && 'anonymous' in user && user.anonymous === true;
}

function isActiveSubscriptionStatus(status: SubscriptionStatus) {
  return status === "active" || status === "trialing";
}
