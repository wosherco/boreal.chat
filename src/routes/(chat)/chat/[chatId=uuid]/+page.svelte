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
  import { tick } from "svelte";

  const { data }: PageProps = $props();

  const messages = $derived(useChatMessages(data.chatId, data.currentChat?.lastMessages ?? null));
  const chat = $derived(useChat(data.chatId, data.currentChat?.chat ?? null));

  // ChatGPT-style scrolling state
  let paddingBottomValue = $state("10rem"); // Default padding (pb-40 = 10rem)
  let previousMessageIds = $state<Set<string>>(new Set());
  let containerElement = $state<HTMLElement>();

  // Track new messages and trigger ChatGPT-style scroll
  $effect(() => {
    if ($messages.data && data.chatId) {
      const currentIds = new Set($messages.data.map((m) => m.id));

      // Check if we have new messages (but not on initial load)
      if (previousMessageIds.size > 0) {
        const hasNewMessages = $messages.data.some((m) => !previousMessageIds.has(m.id));

        if (hasNewMessages) {
          enableChatGPTScrolling();
        }
      }

      previousMessageIds = currentIds;
    }
  });

  async function enableChatGPTScrolling() {
    // Wait for DOM update to render the new message
    await tick();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    if (!containerElement) return;

    // Find all message elements (they should be direct children with the ChatMessage component)
    const messageElements = containerElement.children;

    if (messageElements.length > 0) {
      // Get the last message element (the new one)
      const lastMessageElement = messageElements[messageElements.length - 1] as HTMLElement;

      // Measure the height of the new message in dvh
      const messageHeight = lastMessageElement.offsetHeight;
      const viewportHeight = window.innerHeight;
      const messageHeightInDvh = (messageHeight / viewportHeight) * 100;

      // Calculate dynamic padding: 100dvh - message height
      const paddingInDvh = Math.max(5, 100 - messageHeightInDvh); // Minimum 5dvh padding

      // Apply the dynamic padding
      paddingBottomValue = `${paddingInDvh}dvh`;

      // Wait for padding to be applied
      await tick();

      // Get the main scroll container from layout
      const scrollContainer = document.querySelector("main");

      if (scrollContainer) {
        // Scroll to bottom minus 5dvh
        const targetScrollTop = scrollContainer.scrollHeight - window.innerHeight * 0.05;

        scrollContainer.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        });
      }
    }
  }

  // Reset state when navigating to different chat
  $effect(() => {
    if (data.chatId) {
      paddingBottomValue = "10rem";
      previousMessageIds = new Set();
    }
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
