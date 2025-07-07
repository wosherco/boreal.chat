import {
  PREMIUM_PLAN_NAME,
  UNLIMITED_PLAN_NAME,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "..";
import { BILLING_ENABLED } from "../constants";
import type { UserInfo } from "../sharedTypes";

export function isSubscribed(user: UserInfo | null, bypassBillingDisabled = true) {
  return (
    (user?.subscribedUntil &&
      user.subscriptionStatus &&
      new Date(user.subscribedUntil) > new Date() &&
      isActiveSubscriptionStatus(user.subscriptionStatus)) ||
    (bypassBillingDisabled && !BILLING_ENABLED)
  );
}

function isActiveSubscriptionStatus(status: SubscriptionStatus) {
  return status === "active" || status === "trialing";
}

export function isSubscribedToUnlimitedPlan(user: UserInfo | null) {
  return isSubscribed(user) && user?.subscriptionPlan === "unlimited";
}

export function getSubscribedPlan(user: UserInfo | null): SubscriptionPlan | undefined {
  if (isSubscribedToUnlimitedPlan(user)) return UNLIMITED_PLAN_NAME;
  if (isSubscribed(user)) return PREMIUM_PLAN_NAME;

  return undefined;
}
