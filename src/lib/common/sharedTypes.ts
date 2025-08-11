import type { MessageSegmentKind, SubscriptionPlan, SubscriptionStatus, UserRole } from ".";
import type { ModelId, ReasoningLevel } from "./ai/models";
import type { DBMessage } from "./schema/chats";

export type PossiblySPAData<T> = T | undefined;

export const setPossiblySPAData = <T>(data: PossiblySPAData<T>): PossiblySPAData<T> => data;

export type ServerData<T> = T | Promise<T> | null;
export type ServerDataGetter<T> = () => ServerData<T>;

export type CurrentUserInfo = {
  authenticated: boolean;
  data: UserInfo | null;
};

export type ServerCurrentUserInfo = CurrentUserInfo & {
  canSync: boolean;
};

export type UserModelSettings = {
  allmodels: ModelId[];
  highlight: ModelId[];
};

export type UserInfo = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture: string | null;
  emailVerified: boolean;
  subscribedUntil: Date | null;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPlan: SubscriptionPlan | null;
  modelSettings?: UserModelSettings | null;
};

export interface Chat {
  id: string;
  title: string | null;
  pinned: boolean;
  archived: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatWithSettings extends Chat {
  selectedModel: ModelId | null;
  webSearchEnabled: boolean | null;
  reasoningLevel: ReasoningLevel | null;
  byokId: string | null;
}

export interface Draft {
  id: string;
  content: string;
  selectedModel: ModelId;
  reasoningLevel: ReasoningLevel;
  webSearchEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SegmentJson {
  ordinal: number;
  kind: MessageSegmentKind;

  // For text
  content: string | null;

  // For tool calls
  toolCallId: string | null;
  toolName: string | null;
  toolArgs: unknown | null;
  toolResult: string | null;

  /**
   * If true, means that the message is still streaming, and will be updated when new tokens arrive.
   */
  streaming: boolean;
}

export type MessageWithSegments = DBMessage & {
  /** full body with rich data – may be null if the message has no segments yet */
  segments: SegmentJson[] | null;
};

export type MessageWithOptionalChainRow = MessageWithSegments & {
  /** depth in the parent-pointer chain (1 = newest) */
  depth?: number;
};

export type MessageChainRow = MessageWithSegments & {
  /** depth in the parent-pointer chain (1 = newest) */
  depth: number;
};

export interface BYOKInfo {
  id: string;
  apiKey?: string;
  platform: string;
  createdAt: Date;
  updatedAt: Date;
}
