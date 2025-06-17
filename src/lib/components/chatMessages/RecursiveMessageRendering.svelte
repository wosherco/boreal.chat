<script lang="ts">
  import { afterNavigate, onNavigate } from "$app/navigation";
  import {
    resetCurrentChatState,
    setCurrentChatState,
  } from "$lib/client/state/currentChatState.svelte";
  import type { ChatWithSettings, MessageWithOptionalChainRow } from "$lib/common/sharedTypes";
  import { createMessageTree, findMaxVersionPath, type MessageTreeNode } from "$lib/utils/tree";
  import ChatMessage from "./ChatMessage.svelte";

  interface Props {
    messages: MessageWithOptionalChainRow[];
    chatId: string;
    chat: ChatWithSettings | null;
  }

  const { messages, chatId, chat }: Props = $props();

  const messageTree = $derived(createMessageTree(messages));

  let threadedChat = $state<MessageTreeNode[]>([]);
  let currentChatId = $state("");

  function fixFirstNodes(generatedThreadedChat: MessageTreeNode[]) {
    if (generatedThreadedChat.length >= 2) {
      const firstNode = generatedThreadedChat[0];
      const secondNode = generatedThreadedChat[1];

      secondNode.parent = firstNode;
    }

    return generatedThreadedChat;
  }

  $effect(() => {
    currentChatId = chatId;
    const generatedThreadedChat = findMaxVersionPath({
      children: $state.snapshot(messageTree).roots,
      value: messages[0],
    });

    threadedChat = fixFirstNodes(generatedThreadedChat);
  });

  const lastMessage = $derived(threadedChat[threadedChat.length - 1].value);

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

  function changeThreadId(newThreadId: string, index: number) {
    const newThread = threadedChat.slice(0, index + 1);

    const newThredMessage = newThread[newThread.length - 1].children?.find(
      (child) => child.value.threadId === newThreadId,
    );

    if (!newThredMessage) {
      return;
    }

    const remainingMessage = findMaxVersionPath(newThredMessage);

    threadedChat = fixFirstNodes([...newThread, ...remainingMessage]);
  }
</script>

<div class="flex flex-col gap-2">
  {#each threadedChat.slice(1) as node, index}
    <ChatMessage
      message={node.value}
      messageNode={node}
      onChangeThreadId={(threadId) => changeThreadId(threadId, index)}
    />
  {/each}
</div>
