import { isFuture } from "date-fns";
import { type SubscriptionStatus } from "..";
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

function isActiveSubscriptionStatus(status: SubscriptionStatus) {
  return status === "active" || status === "trialing";
}
