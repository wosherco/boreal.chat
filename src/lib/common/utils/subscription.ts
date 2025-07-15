import { BILLING_ENABLED } from "../constants";
import type { UserInfo } from "../sharedTypes";

export function hasCredits(user: UserInfo | null, bypassBillingDisabled = true) {
  if (!BILLING_ENABLED && bypassBillingDisabled) {
    return true;
  }

  if (!user?.credits) {
    return false;
  }

  return parseFloat(user.credits) > 0;
}

// Legacy function for backward compatibility - now checks credits instead
export function isSubscribed(user: UserInfo | null, bypassBillingDisabled = true) {
  return hasCredits(user, bypassBillingDisabled);
}
