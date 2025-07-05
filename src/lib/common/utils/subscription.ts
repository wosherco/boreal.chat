import type { SubscriptionStatus } from "..";
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
