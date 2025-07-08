<script lang="ts" module>
  let searchCommandOpen = $state(false);

  export function openSearchCommand() {
    searchCommandOpen = true;
  }

  export function closeSearchCommand() {
    searchCommandOpen = false;
  }
</script>

<script lang="ts">
  import { Command } from "$lib/components/ui/command";
  import { createQuery } from "@tanstack/svelte-query";
  import { Loader2Icon, MessageSquareIcon } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import { orpc } from "$lib/client/orpc";
  import { deferredPromise } from "$lib/utils";
  import { browser } from "$app/environment";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import * as m from "$lib/paraglide/messages";

  let searchInput = $state("");

  const currentUser = useCurrentUser(null);

  const debouncedSearchInput = $derived.by(() => {
    const { promise, resolve } = deferredPromise<string>();

    const timeout = setTimeout(() => {
      resolve(searchInput);
    }, 300);

    return {
      promise,
      pending: true,
      cleanup: () => clearTimeout(timeout),
    };
  });

  const searchedChats = createQuery(() => ({
    queryKey: ["search-chats", debouncedSearchInput.promise],
    queryFn: async () => {
      const query = await debouncedSearchInput.promise;

      if (!query.trim()) {
        return [];
      }

      return orpc.v1.chat.searchChats({ query });
    },
    enabled:
      browser &&
      !!$currentUser.data?.authenticated &&
      !!$currentUser.data?.data &&
      searchInput.trim() !== "",
  }));

  $effect(() => {
    const cleanup = debouncedSearchInput.cleanup;
    return cleanup;
  });
</script>

<KeyboardShortcuts
  combos={[
    {
      key: "k",
      isControl: true,
      callback: openSearchCommand,
    },
  ]}
/>

<Command.Dialog bind:open={searchCommandOpen} shouldFilter={false}>
  <Command.Input placeholder={m.search_typeToSearch()} bind:value={searchInput} />
  <Command.List>
    <Command.Group heading={m.search_chats()}>
      {#each searchedChats ?? [] as chat (chat.chatId)}
        <Command.Item
          onclick={() => {
            searchCommandOpen = false;
            goto(`/chat/${chat.chatId}`);
          }}
        >
          <MessageSquareIcon />
          {chat.title}
        </Command.Item>
      {/each}
    </Command.Group>
    <Command.Empty>
      {#if debouncedSearchInput.pending}
        <div class="flex items-center justify-center gap-2">
          <Loader2Icon class="h-4 w-4 animate-spin" />
        </div>
      {:else}
        {m.search_noResultsFound()}
      {/if}
    </Command.Empty>
  </Command.List>
</Command.Dialog>
