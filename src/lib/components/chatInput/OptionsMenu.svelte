<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
  } from "../ui/dropdown-menu";
  import {
    BrainIcon,
    CheckIcon,
    ChevronRightIcon,
    CpuIcon,
    KeyIcon,
    GlobeIcon,
  } from "@lucide/svelte";
  import Drawer from "../ui/drawer/drawer.svelte";
  import { DrawerContent, DrawerTrigger } from "../ui/drawer";
  import {
    MODEL_DETAILS,
    REASONING_LEVELS,
    REASONING_LOW,
    type ModelId,
    type ReasoningLevel,
  } from "$lib/common/ai/models";
  import Button from "../ui/button/button.svelte";
  import ModelPickerContent from "./ModelPickerPopover/ModelPickerPopoverContent.svelte";
  import { createBYOKs } from "$lib/client/hooks/useBYOKs.svelte";
  import { Switch } from "../ui/switch";
  import HelpTooltip from "../utils/HelpTooltip.svelte";
  import { capitalize } from "$lib/utils/text";

  interface Props {
    /**
     * @bindable
     */
    open?: boolean;
    children: Snippet;
    selectedModel: ModelId;
    onSelectModel: (model: ModelId) => void;
    /**
     * @bindable
     */
    byokId?: string;
    onSelectByok?: (byokId: string | undefined) => void;
    /**
     * @bindable
     */
    reasoningLevel: ReasoningLevel;
    onSelectReasoningLevel: (reasoningLevel: ReasoningLevel) => void;
    /**
     * @bindable
     */
    webSearch?: boolean;
    onSelectWebSearch?: (webSearch: boolean) => void;
  }

  let inputRef = $state<HTMLInputElement | null>(null);

  let {
    children,
    open = $bindable(false),
    selectedModel,
    onSelectModel,
    byokId = $bindable(undefined),
    onSelectByok,
    reasoningLevel = $bindable(REASONING_LOW),
    onSelectReasoningLevel,
    webSearch = $bindable(false),
    onSelectWebSearch,
  }: Props = $props();

  let windowWidth = $state(0);
  const isMobile = $derived(windowWidth < 768);

  $effect(() => {
    if (inputRef) {
      const timeout = setTimeout(() => {
        inputRef?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  });

  const byoks = createBYOKs(() => null);

  // For now we just a single byok, openrouter. In the future we need to add a menu.
  const openRouterByok = $derived(byoks.data?.find((byok) => byok.platform === "openrouter"));
  const hasBYOKs = $derived(!!openRouterByok);

  function toggleBYOK() {
    onSelectByok?.(byokId ? undefined : openRouterByok?.id);
  }

  function toggleWebSearch() {
    onSelectWebSearch?.(!webSearch);
  }

  const modelDetails = $derived(MODEL_DETAILS[selectedModel]);
  const modelSupportsReasoning = $derived(!!modelDetails?.reasoning);
</script>

<svelte:window bind:innerWidth={windowWidth} />

{#snippet modelsButton()}
  <CpuIcon class="size-4" />
  Models
  {#if selectedModel}
    <span class="text-muted-foreground text-xs">
      {modelDetails?.displayName ?? "Unknown"}
    </span>
  {/if}
{/snippet}

{#snippet modelsPicker()}
  <ModelPickerContent
    bind:open
    onSelect={onSelectModel}
    {selectedModel}
    bind:inputRef
    byokEnabled={!!byokId}
  />
{/snippet}

{#snippet byokButton()}
  <KeyIcon class="size-4" />
  BYOK
  {#if !hasBYOKs}
    <HelpTooltip>You don't have any BYOKs yet.</HelpTooltip>
  {/if}
  <Switch checked={!!byokId} onchange={toggleBYOK} class="ml-auto" />
{/snippet}

{#snippet webSearchButton()}
  <GlobeIcon class="size-4" />
  Web Search
  <Switch checked={!!webSearch} onchange={toggleWebSearch} class="ml-auto" />
{/snippet}

{#snippet reasoningButton()}
  <BrainIcon class="size-4" />
  Reasoning Level
  {#if !modelSupportsReasoning}
    <HelpTooltip>This model does not support reasoning.</HelpTooltip>
  {/if}
{/snippet}

{#if isMobile}
  <Drawer bind:open>
    <DrawerTrigger>
      {@render children()}
    </DrawerTrigger>
    <DrawerContent>
      <!-- MODEL PICKER -->
      <Drawer>
        <DrawerTrigger>
          <Button variant="ghost" class="w-full justify-start">
            {@render modelsButton()}
            <ChevronRightIcon class="ml-auto size-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent class="p-0">
          {@render modelsPicker()}
        </DrawerContent>
      </Drawer>

      <!-- BYOK -->
      <Button
        variant="ghost"
        class="w-full justify-start"
        onclick={toggleBYOK}
        disabled={!hasBYOKs}
      >
        {@render byokButton()}
      </Button>

      <!-- WEB SEARCH -->
      <Button variant="ghost" class="w-full justify-start" onclick={toggleWebSearch}>
        {@render webSearchButton()}
      </Button>

      <!-- REASONING -->
      <Drawer>
        <DrawerTrigger disabled={!modelSupportsReasoning}>
          <Button variant="ghost" class="w-full justify-start" disabled={!modelSupportsReasoning}>
            {@render reasoningButton()}
          </Button>
        </DrawerTrigger>
        <DrawerContent class="p-0">
          {#each REASONING_LEVELS as reasoningLevelOption}
            <Button
              variant="ghost"
              class="w-full justify-start"
              onclick={() => onSelectReasoningLevel?.(reasoningLevelOption)}
            >
              {capitalize(reasoningLevelOption)}
              {#if reasoningLevel === reasoningLevelOption}
                <CheckIcon class="ml-auto size-4" />
              {/if}
            </Button>
          {/each}
        </DrawerContent>
      </Drawer>
    </DrawerContent>
  </Drawer>
{:else}
  <DropdownMenu bind:open>
    <DropdownMenuTrigger>
      {@render children()}
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <!-- MODEL PICKER -->
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          {@render modelsButton()}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent class="p-0">
          {@render modelsPicker()}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <!-- BYOK -->
      <DropdownMenuItem onSelect={toggleBYOK} disabled={!hasBYOKs} closeOnSelect={false}>
        {@render byokButton()}
      </DropdownMenuItem>

      <!-- WEB SEARCH -->
      <DropdownMenuItem onSelect={toggleWebSearch} closeOnSelect={false}>
        {@render webSearchButton()}
      </DropdownMenuItem>

      <!-- REASONING -->
      <DropdownMenuSub>
        <DropdownMenuSubTrigger disabled={!modelSupportsReasoning}>
          {@render reasoningButton()}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent class="p-0">
          {#each REASONING_LEVELS as reasoningLevelOption}
            <DropdownMenuItem onSelect={() => onSelectReasoningLevel?.(reasoningLevelOption)}>
              {capitalize(reasoningLevelOption)}
              {#if reasoningLevel === reasoningLevelOption}
                <CheckIcon class="ml-auto size-4" />
              {/if}
            </DropdownMenuItem>
          {/each}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenu>
{/if}
