import type Stripe from "stripe";

export const USER_ROLES = ["ANONYMOUS", "USER", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const MESSAGE_TYPES = ["user", "assistant"] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number];

export const MESSAGE_STATUS = [
  "processing",
  "waiting_confirmation",
  "finished",
  "error",
  "cancelled",
] as const;
export type MessageStatus = (typeof MESSAGE_STATUS)[number];

export const isFinishedMessageStatus = (status: MessageStatus) =>
  status === "finished" || status === "cancelled" || status === "error";

export const MESSAGE_SEGMENT_KINDS = ["reasoning", "text", "tool_call", "tool_result"] as const;

export type MessageSegmentKind = (typeof MESSAGE_SEGMENT_KINDS)[number];

export const SHARE_TYPES = ["message", "thread", "chat"] as const;
export type ShareType = (typeof SHARE_TYPES)[number];

export const SHARE_PRIVACY_OPTIONS = ["private", "emails", "public"] as const;
export type SharePrivacy = (typeof SHARE_PRIVACY_OPTIONS)[number];

export const SUBSCRIPTION_STATUS = [
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "paused",
  "trialing",
  "unpaid",
] as const satisfies Stripe.Subscription.Status[];

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

export const UNLIMITED_PLAN_NAME = "unlimited";
export const SUBSCRIPTION_PLANS = [UNLIMITED_PLAN_NAME] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const BYOK_PLATFORMS = ["openrouter"] as const;
export type ByokPlatform = (typeof BYOK_PLATFORMS)[number];

export const ASSET_TYPES = ["s3_file"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];
