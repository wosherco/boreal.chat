import type { SubscriptionStatus } from "..";
import type { UserInfo } from "../sharedTypes";

export function isSubscribed(user: UserInfo | null) {
  return (
    user?.subscribedUntil &&
    user.subscriptionStatus &&
    new Date(user.subscribedUntil) > new Date() &&
    isActiveSubscriptionStatus(user.subscriptionStatus)
  );
}

function isActiveSubscriptionStatus(status: SubscriptionStatus) {
  return status === "active" || status === "trialing";
}
