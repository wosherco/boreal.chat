export const USER_ROLES = ["USER", "ADMIN"] as const;

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
