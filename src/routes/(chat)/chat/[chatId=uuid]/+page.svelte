<script lang="ts">
  import { useChat } from "$lib/client/hooks/useChat.svelte";
  import { useChatMessages } from "$lib/client/hooks/useChatMessages.svelte";
  import ChatMessage from "$lib/components/chatMessages/ChatMessage.svelte";
  import ChatSkeleton from "$lib/components/chatMessages/ChatSkeleton.svelte";
  import RecursiveMessageRendering from "$lib/components/chatMessages/RecursiveMessageRendering.svelte";
  import SvelteSeo from "svelte-seo";
  import type { PageProps } from "./$types";
  import { cn } from "$lib/utils";
  import { isSidebarCollapsed } from "../../+layout.svelte";
  import { sendMessageEventDispatcher } from "$lib/client/state/sendMessageEventDispatcher";

  const { data }: PageProps = $props();

  const messages = $derived(useChatMessages(data.chatId, data.currentChat?.lastMessages ?? null));
  const chat = $derived(useChat(data.chatId, data.currentChat?.chat ?? null));

  // ChatGPT-style scrolling state
  let paddingBottomValue = $state("10rem"); // Default padding (pb-40 = 10rem)
  let containerElement = $state<HTMLElement>();

  $effect(() => {
    const listener = sendMessageEventDispatcher.addListener("message_dispatched", (data) => {
      // TODO: Scroll
    });

    return () => {
      listener();
    };
  });
</script>

<SvelteSeo title={`${$chat.data?.title} | boreal.chat`} />

<div
  bind:this={containerElement}
  style="padding-bottom: {paddingBottomValue};"
  class={cn(
    "mx-auto flex w-full max-w-screen min-w-0 flex-col gap-2 overflow-x-hidden px-4 pt-16",
    isSidebarCollapsed()
      ? "md:max-w-screen-md"
      : "md:max-w-[min(var(--breakpoint-md),calc(100vw-var(--spacing)*80)))]",
  )}
>
  {#if $messages.loading || !$messages.data}
    <ChatSkeleton />
  {:else if $messages.ssr}
    {#each $messages.data as value (value.id)}
      <ChatMessage message={value} />
    {/each}
  {:else}
    <RecursiveMessageRendering
      messages={$messages.data}
      chatId={data.chatId}
      chat={$chat.data ?? null}
    />
  {/if}
</div>
