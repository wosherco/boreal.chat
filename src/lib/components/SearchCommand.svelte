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
  import { searchChats } from "$lib/client/db/fts";

  import * as Command from "$lib/components/ui/command";
  import KeyboardShortcuts from "./utils/KeyboardShortcuts.svelte";
  import { Debounced } from "runed";
  import { Loader2Icon, MessageSquareIcon } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  let searchInput = $state<string>("");
  const debouncedSearchInput = new Debounced(() => searchInput, 500);
  let searchedChats = $state<
    | {
        chatId: string;
        messageId: string;
        threadId: string;
        title: string | null;
        segmentContent: string | null;
      }[]
    | undefined
  >(undefined);

  $effect(() => {
    if (!searchCommandOpen) {
      searchInput = "";
      debouncedSearchInput.cancel();
    }
  });

  $effect(() => {
    if (searchInput.trim().length === 0) {
      debouncedSearchInput.updateImmediately();
      searchedChats = undefined;
    }
  });

  // FTS effect
  $effect(() => {
    if (debouncedSearchInput.current.trim().length === 0) {
      searchedChats = undefined;
      return;
    }

    void searchChats(debouncedSearchInput.current).then((chats) => {
      searchedChats = chats;
    });
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
  <Command.Input placeholder="Type to search..." bind:value={searchInput} />
  <Command.List>
    <Command.Group heading="Chats">
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
        No results found.
      {/if}
    </Command.Empty>
  </Command.List>
</Command.Dialog>
