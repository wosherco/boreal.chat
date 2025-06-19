<script lang="ts">
  import { goto } from "$app/navigation";
  import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandItem,
    CommandEmpty,
  } from "$lib/components/ui/command";
  import type { Readable } from "svelte/store";
  import type { HydratableDataResult, Chat } from "$lib/common/sharedTypes";
  import { searchChats } from "$lib/client/db/search";
  import { get } from "svelte/store";

  export let open = $bindable(false);
  export let chats: Readable<HydratableDataResult<Chat[]>>;

  let query = $state("");
  let results: Chat[] = [];
  let timeout: ReturnType<typeof setTimeout>;

  $effect(() => {
    if (open) {
      query = "";
      results = [];
    }
  });

  $effect(() => {
    clearTimeout(timeout);
    const q = query.trim();
    if (!q) {
      results = [];
      return;
    }

    timeout = setTimeout(async () => {
      results = await searchChats(q);
    }, 100);
  });
</script>

<CommandDialog bind:open let:value bind:value={query}>
  <CommandInput bind:value={query} placeholder="Search chats..." />
  <CommandList>
    {#if query.trim() === ""}
      {#if $chats.data && $chats.data.length > 0}
        {#each $chats.data as chat}
          <CommandItem on:select={() => goto(`/chat/${chat.id}`)}
            >{chat.title ?? "No title"}</CommandItem
          >
        {/each}
      {:else}
        <CommandEmpty>No chats found</CommandEmpty>
      {/if}
    {:else if results.length > 0}
      {#each results as chat}
        <CommandItem on:select={() => goto(`/chat/${chat.id}`)}
          >{chat.title ?? "No title"}</CommandItem
        >
      {/each}
    {:else}
      <CommandEmpty>No results.</CommandEmpty>
    {/if}
  </CommandList>
</CommandDialog>
