<!-- Not virtualized for now -->
<script lang="ts">
  import type { Chat } from "$lib/common/sharedTypes";
  import { MessageSquareIcon } from "@lucide/svelte";
  import { currentDate, groupByDate } from "$lib/utils/dates.svelte";
  import { cn } from "$lib/utils";
  import { page } from "$app/state";
  import { Button } from "../ui/button";
  import SheetClosableOnlyOnPhone from "../utils/SheetClosableOnlyOnPhone.svelte";

  interface Props {
    chats: Chat[] | null;
    isPhone: boolean;
  }

  const { chats, isPhone }: Props = $props();

  const sortedChats = $derived(!chats ? null : groupByDate(chats, currentDate()));
</script>

{#snippet chatButton(chat: Chat)}
  <SheetClosableOnlyOnPhone {isPhone} class="text-start">
    <Button
      variant="ghost"
      size="sm"
      class={cn("justify-start", page.params.chatId === chat.id && "bg-accent")}
      href={`/chat/${chat.id}`}
    >
      <MessageSquareIcon class="text-muted-foreground h-4 w-4 flex-shrink-0" />
      <span class="truncate text-sm font-medium">{chat.title ?? "No title"}</span>
    </Button>
  </SheetClosableOnlyOnPhone>
{/snippet}

<div class="flex h-full flex-col gap-2 overflow-hidden">
  {#if chats === null || sortedChats === null || chats.length === 0}
    <div class="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
      <MessageSquareIcon class="mb-2 h-8 w-8" />
      <p class="text-sm">No chats yet</p>
      <p class="mt-1 text-xs">Start a new conversation</p>
    </div>
  {:else}
    <div class="flex w-full flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto">
      {#if sortedChats.today.length > 0}
        <p class="text-muted-foreground py-1 pl-2 text-sm font-medium">Today</p>
        {#each sortedChats.today as chat (chat.id)}
          {@render chatButton(chat)}
        {/each}
      {/if}

      {#if sortedChats.yesterday.length > 0}
        <p class="text-muted-foreground py-1 pl-2 text-sm font-medium">Yesterday</p>
        {#each sortedChats.yesterday as chat (chat.id)}
          {@render chatButton(chat)}
        {/each}
      {/if}

      {#if sortedChats.thisWeek.length > 0}
        <p class="text-muted-foreground py-1 pl-2 text-sm font-medium">This week</p>
        {#each sortedChats.thisWeek as chat (chat.id)}
          {@render chatButton(chat)}
        {/each}
      {/if}

      {#if sortedChats.lastWeek.length > 0}
        <p class="text-muted-foreground py-1 pl-2 text-sm font-medium">Last week</p>
        {#each sortedChats.lastWeek as chat (chat.id)}
          {@render chatButton(chat)}
        {/each}
      {/if}

      {#if sortedChats.others.length > 0}
        <p class="text-muted-foreground py-1 pl-2 text-sm font-medium">Others</p>
        {#each sortedChats.others as chat (chat.id)}
          {@render chatButton(chat)}
        {/each}
      {/if}
    </div>
  {/if}
</div>
