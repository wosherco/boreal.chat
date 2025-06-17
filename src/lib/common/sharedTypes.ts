import type { MessageSegmentKind } from ".";
import type { ModelId, ReasoningLevel } from "./ai/models";
import type { DBMessage } from "./schema/chats";

export type PossiblySPAData<T> = T | undefined;

export const setPossiblySPAData = <T>(data: PossiblySPAData<T>): PossiblySPAData<T> => data;

export type ServerData<T> = T | Promise<T> | null;

export interface HydratableDataResult<T> {
  loading: boolean;
  ssr: boolean;
  data: T | null;
}

export type BasicUserInfo = {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
};

export type CurrentUserInfo =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      user: BasicUserInfo;
    };

export interface Chat {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatWithSettings extends Chat {
  selectedModel: ModelId | null;
  webSearchEnabled: boolean | null;
  reasoningLevel: ReasoningLevel | null;
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
}

export interface TokenStreamJson {
  token: string;
  kind: MessageSegmentKind;
}

export type MessageWithSegments = DBMessage & {
  /** full body with rich data – may be null if the message has no segments yet */
  segments: SegmentJson[] | null;
};

export type MessageWithSegmentsAndTokenStream = MessageWithSegments & {
  /** live token stream while the message is still “processing” */
  tokenStream: TokenStreamJson[] | null;
};

export type MessageWithOptionalChainRow = MessageWithSegmentsAndTokenStream & {
  /** depth in the parent-pointer chain (1 = newest) */
  depth?: number;
};

export type MessageChainRow = MessageWithSegmentsAndTokenStream & {
  /** depth in the parent-pointer chain (1 = newest) */
  depth: number;
};
