<script lang="ts">
  import { createChat } from "$lib/client/hooks/useChat.svelte";
  import { createChatMessages } from "$lib/client/hooks/useChatMessages.svelte";
  import ChatMessage from "$lib/components/chatMessages/ChatMessage.svelte";
  import ChatSkeleton from "$lib/components/chatMessages/ChatSkeleton.svelte";
  import SvelteSeo from "svelte-seo";
  import type { PageProps } from "./$types";
  import { cn } from "$lib/utils";
  import { isSidebarCollapsed } from "../../../+layout.svelte";
  import RecursiveMessageRendering from "$lib/components/chatMessages/RecursiveMessageRendering.svelte";

  const { data }: PageProps = $props();

  const messages = createChatMessages(
    () => data.currentChat?.lastMessages ?? null,
    () => data.chatId,
  );

  const chat = createChat(
    () => data.currentChat?.chat ?? null,
    () => data.chatId,
  );
</script>

<SvelteSeo title={`${chat.data?.title ?? "Loading chat..."} | boreal.chat`} />

<div
  class={cn(
    "mx-auto flex w-full max-w-screen min-w-0 flex-col gap-6 overflow-x-hidden px-4 pt-16 pb-36",
    isSidebarCollapsed()
      ? "md:max-w-screen-md"
      : "md:max-w-[min(var(--breakpoint-md),calc(100vw-var(--spacing)*80)))]",
  )}
>
  {#if messages.loading || !messages.data}
    <ChatSkeleton />
  {:else if messages.ssr}
    {#each messages.data as value (value.id)}
      <ChatMessage message={value} />
    {/each}
  {:else}
    <RecursiveMessageRendering
      messages={messages.data}
      chatId={data.chatId}
      chat={chat.data ?? null}
    />
  {/if}
</div>
