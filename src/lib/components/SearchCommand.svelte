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
  import { MODELS, MODEL_DETAILS, type ModelId } from "$lib/common/ai/models";
  import { ICON_MAP } from "../icons/iconMap";

  import * as Command from "$lib/components/ui/command";
  import KeyboardShortcuts from "./utils/KeyboardShortcuts.svelte";
  import ModelPickerModelEntry from "./chatInput/ModelPickerModelEntry.svelte";
  import { Debounced } from "runed";
  import { 
    Loader2Icon, 
    MessageSquareIcon, 
    BrainIcon,
    SearchIcon,
    SparklesIcon 
  } from "@lucide/svelte";
  import { goto } from "$app/navigation";

  interface Props {
    /**
     * If true, only shows search functionality. If false, shows model selection and other features.
     */
    onlySearch?: boolean;
    /**
     * Callback when a model is selected
     */
    onModelSelect?: (modelId: ModelId) => void;
    /**
     * Currently selected model (for highlighting)
     */
    selectedModel?: ModelId;
  }

  let { 
    onlySearch = false, 
    onModelSelect,
    selectedModel 
  }: Props = $props();

  let searchInput = $state<string>("");
  const debouncedSearchInput = new Debounced(() => searchInput, 300);
  
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
  
  let isSearching = $state(false);

  $effect(() => {
    if (!searchCommandOpen) {
      searchInput = "";
      debouncedSearchInput.cancel();
      searchedChats = undefined;
      isSearching = false;
    }
  });

  $effect(() => {
    if (searchInput.trim().length === 0) {
      debouncedSearchInput.updateImmediately();
      searchedChats = undefined;
      isSearching = false;
    }
  });

  // Enhanced FTS effect with loading state
  $effect(() => {
    if (debouncedSearchInput.current.trim().length === 0) {
      searchedChats = undefined;
      isSearching = false;
      return;
    }

    isSearching = true;
    void searchChats(debouncedSearchInput.current).then((chats) => {
      searchedChats = chats;
      isSearching = false;
    }).catch(() => {
      searchedChats = [];
      isSearching = false;
    });
  });

  function handleModelSelect(modelId: ModelId) {
    onModelSelect?.(modelId);
    searchCommandOpen = false;
  }

  function handleChatSelect(chatId: string) {
    searchCommandOpen = false;
    goto(`/chat/${chatId}`);
  }

  // Determine if we should show search results
  const shouldShowSearchResults = $derived(
    searchInput.trim().length > 0 || isSearching || searchedChats !== undefined
  );
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
  <Command.Input 
    placeholder={onlySearch ? "Search chats..." : "Search or select model..."} 
    bind:value={searchInput} 
  />
  <Command.List>
    <!-- Model Selection Group (only shown when not in onlySearch mode) -->
    {#if !onlySearch && !shouldShowSearchResults}
      <Command.Group heading="Models">
        {#each MODELS as model (model)}
          <Command.Item
            value={model}
            data-selected={selectedModel === model}
            onclick={() => handleModelSelect(model)}
          >
            <ModelPickerModelEntry {model} />
          </Command.Item>
        {/each}
      </Command.Group>

      <!-- Future Features Placeholder -->
      <Command.Separator />
      <Command.Group heading="Coming Soon">
        <Command.Item disabled>
          <SearchIcon class="h-4 w-4" />
          Web Search
          <Command.Shortcut>Soon</Command.Shortcut>
        </Command.Item>
        <Command.Item disabled>
          <SparklesIcon class="h-4 w-4" />
          AI Tools
          <Command.Shortcut>Soon</Command.Shortcut>
        </Command.Item>
      </Command.Group>
    {/if}

    <!-- Chat Search Results (shown when searching or has search input) -->
    {#if shouldShowSearchResults}
      <Command.Group heading="Chat Results">
        {#if isSearching}
          <Command.Item disabled>
            <div class="flex items-center justify-center gap-2 w-full py-2">
              <Loader2Icon class="h-4 w-4 animate-spin" />
              <span class="text-sm text-muted-foreground">Searching chats...</span>
            </div>
          </Command.Item>
        {:else if searchedChats && searchedChats.length > 0}
          {#each searchedChats as chat (chat.chatId)}
            <Command.Item onclick={() => handleChatSelect(chat.chatId)}>
              <MessageSquareIcon class="h-4 w-4" />
              <div class="flex flex-col gap-1 min-w-0 flex-1">
                <span class="font-medium text-sm truncate">
                  {chat.title || "Untitled Chat"}
                </span>
                {#if chat.segmentContent}
                  <span class="text-xs text-muted-foreground truncate">
                    {chat.segmentContent}
                  </span>
                {/if}
              </div>
            </Command.Item>
          {/each}
        {:else}
          <Command.Item disabled>
            <div class="flex items-center justify-center gap-2 w-full py-2">
              <MessageSquareIcon class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm text-muted-foreground">No chats found</span>
            </div>
          </Command.Item>
        {/if}
      </Command.Group>
    {/if}

    <!-- Empty state for no search input in onlySearch mode -->
    {#if onlySearch && !shouldShowSearchResults}
      <Command.Empty>
        <div class="flex flex-col items-center justify-center gap-2 py-6">
          <SearchIcon class="h-8 w-8 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">Start typing to search chats</span>
        </div>
      </Command.Empty>
    {/if}

    <!-- Global empty state -->
    {#if !onlySearch && !shouldShowSearchResults && MODELS.length === 0}
      <Command.Empty>
        <div class="flex flex-col items-center justify-center gap-2 py-6">
          <BrainIcon class="h-8 w-8 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">No models available</span>
        </div>
      </Command.Empty>
    {/if}
  </Command.List>
</Command.Dialog>
