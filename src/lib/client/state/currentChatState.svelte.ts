import type { MessageStatus } from "$lib/common";
import type { ModelId, ReasoningLevel } from "$lib/common/ai/models";

interface CurrentChatState {
  lastMessageId: string;
  lastMessageStatus: MessageStatus;
  chatId: string;
  model: ModelId | undefined;
  webSearchEnabled: boolean | undefined;
  reasoningLevel: ReasoningLevel | undefined;
}

let currentChatState = $state<CurrentChatState | null>(null);

export const getCurrentChatState = () => currentChatState;

export const setCurrentChatState = (state: CurrentChatState) => {
  currentChatState = state;
};

export const resetCurrentChatState = () => {
  currentChatState = null;
};
