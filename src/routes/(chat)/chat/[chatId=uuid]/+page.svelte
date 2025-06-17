<script lang="ts">
  import { useChat } from "$lib/client/hooks/useChat.svelte";
  import { useChatMessages } from "$lib/client/hooks/useChatMessages.svelte";
  import ChatMessage from "$lib/components/chatMessages/ChatMessage.svelte";
  import ChatSkeleton from "$lib/components/chatMessages/ChatSkeleton.svelte";
  import RecursiveMessageRendering from "$lib/components/chatMessages/RecursiveMessageRendering.svelte";
  import type { PageData } from "./$types";

  const { data }: { data: PageData } = $props();

  const messages = $derived(useChatMessages(data.chatId, data.lastMessages));
  const chat = $derived(useChat(data.chat.id, data.chat));
</script>

<div class="mx-auto flex max-w-screen-md flex-col gap-4 px-4 pt-16 pb-36">
  {#if $messages.loading || !$messages.data}
    <div class="flex h-full w-full flex-col gap-4">
      <ChatSkeleton />
    </div>
  {:else if $messages.ssr}
    {#each $messages.data as value}
      <ChatMessage message={value} />
    {/each}
  {:else}
    <RecursiveMessageRendering
      messages={$messages.data}
      chatId={data.chat.id}
      chat={$chat.data ?? null}
    />
  {/if}
</div>
