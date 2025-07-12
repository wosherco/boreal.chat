<script lang="ts">
  import { afterNavigate, onNavigate } from "$app/navigation";
  import {
    resetCurrentChatState,
    setCurrentChatState,
  } from "$lib/client/state/currentChatState.svelte";
  import type { ChatWithSettings, MessageWithOptionalChainRow } from "$lib/common/sharedTypes";
  import { createThreadedChat, type MessageTreeNode } from "$lib/utils/tree";
  import { untrack } from "svelte";
  import ChatMessage from "./ChatMessage.svelte";

  interface Props {
    messages: MessageWithOptionalChainRow[];
    chatId: string;
    chat: ChatWithSettings | null;
    isSharedView?: boolean;
  }

  const { messages, chatId, chat, isSharedView }: Props = $props();

  let threadedChat = $state<MessageTreeNode[]>([]);
  let currentChatId = $state("");

  const lastMessage = $derived(
    threadedChat.length > 0 ? threadedChat[threadedChat.length - 1].value : null,
  );
  const latestMessage = $derived(
    messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0],
  );

  $effect(() => {
    if (currentChatId !== chatId) {
      currentChatId = chatId;
      threadedChat = createThreadedChat(messages, latestMessage?.id);
    } else {
      const untrackedLastMessage = untrack(() => lastMessage);

      threadedChat = createThreadedChat(messages, untrackedLastMessage?.id);
    }
  });

  function changeThreadId(newThreadId: string) {
    const firstThreadMessage = messages.find((message) => message.threadId === newThreadId);

    if (!firstThreadMessage) {
      return;
    }

    threadedChat = createThreadedChat(messages, firstThreadMessage.id);
  }

  // Global state stuff...

  onNavigate(() => {
    resetCurrentChatState();
  });

  const updateGlobalState = $derived(() => {
    if (!lastMessage) {
      return;
    }

    setCurrentChatState({
      lastMessageId: lastMessage.id,
      lastMessageStatus: lastMessage.status,
      chatId: chatId,
      model: chat?.selectedModel ?? undefined,
      webSearchEnabled: chat?.webSearchEnabled ?? undefined,
      reasoningLevel: chat?.reasoningLevel ?? undefined,
    });
  });

  afterNavigate(() => updateGlobalState());
  $effect(() => updateGlobalState());
</script>

{#each threadedChat as node (node.value.id)}
  <ChatMessage
    message={node.value}
    messageNode={node}
    onChangeThreadId={(threadId) => changeThreadId(threadId)}
    {isSharedView}
  />
{/each}
