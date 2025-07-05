<!-- Not virtualized for now -->
<script lang="ts">
  import type { Chat } from "$lib/common/sharedTypes";
  import { MessageSquareIcon } from "@lucide/svelte";
  import { currentDate, groupByDate } from "$lib/utils/dates.svelte";
  import ChatItem from "./ChatItem.svelte";

  interface Props {
    chats: Chat[] | null;
    isPhone: boolean;
  }

  const { chats, isPhone }: Props = $props();

  const pinnedChats = $derived(!chats ? [] : chats.filter((chat) => chat.pinned));
  const unpinnedChats = $derived(!chats ? [] : chats.filter((chat) => !chat.pinned));
  const sortedChats = $derived(!unpinnedChats ? null : groupByDate(unpinnedChats, currentDate()));
</script>

<div class="flex h-full w-full min-w-0 flex-col gap-1 overflow-y-auto">
  {#if chats === null || chats.length === 0}
    <div class="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
      <MessageSquareIcon class="mb-2 h-8 w-8" />
      <p class="text-sm">No chats yet</p>
      <p class="mt-1 text-xs">Start a new conversation</p>
    </div>
  {:else}
    {#if pinnedChats.length > 0}
      <p class="text-muted-foreground py-1 pl-2 text-sm font-medium">Pinned</p>
      {#each pinnedChats as chat (chat.id)}
        <ChatItem {chat} {isPhone} />
      {/each}
    {/if}

    {#if sortedChats && (sortedChats.today.length > 0 || sortedChats.yesterday.length > 0 || sortedChats.thisWeek.length > 0 || sortedChats.lastWeek.length > 0 || sortedChats.others.length > 0)}
      {#if sortedChats.today.length > 0}
        <p class="text-muted-foreground py-1 pl-2 text-sm font-medium">Today</p>
        {#each sortedChats.today as chat (chat.id)}
          <ChatItem {chat} {isPhone} />
        {/each}
      {/if}

      {#if sortedChats.yesterday.length > 0}
        <p class="text-muted-foreground py-1 pl-2 text-sm font-medium">Yesterday</p>
        {#each sortedChats.yesterday as chat (chat.id)}
          <ChatItem {chat} {isPhone} />
        {/each}
      {/if}

      {#if sortedChats.thisWeek.length > 0}
        <p class="text-muted-foreground py-1 pl-2 text-sm font-medium">This week</p>
        {#each sortedChats.thisWeek as chat (chat.id)}
          <ChatItem {chat} {isPhone} />
        {/each}
      {/if}

      {#if sortedChats.lastWeek.length > 0}
        <p class="text-muted-foreground py-1 pl-2 text-sm font-medium">Last week</p>
        {#each sortedChats.lastWeek as chat (chat.id)}
          <ChatItem {chat} {isPhone} />
        {/each}
      {/if}

      {#if sortedChats.others.length > 0}
        <p class="text-muted-foreground py-1 pl-2 text-sm font-medium">Others</p>
        {#each sortedChats.others as chat (chat.id)}
          <ChatItem {chat} {isPhone} />
        {/each}
      {/if}
    {/if}
  {/if}
</div>
