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
  import { ChevronRightIcon, CpuIcon, KeyIcon } from "@lucide/svelte";
  import Drawer from "../ui/drawer/drawer.svelte";
  import { DrawerContent, DrawerTrigger } from "../ui/drawer";
  import { MODEL_DETAILS, type ModelId } from "$lib/common/ai/models";
  import Button from "../ui/button/button.svelte";
  import ModelPickerContent from "./ModelPickerPopover/ModelPickerPopoverContent.svelte";
  import { useBYOKs } from "$lib/client/hooks/useBYOKs.svelte";
  import { Switch } from "../ui/switch";

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
  }

  let inputRef = $state<HTMLInputElement | null>(null);

  let {
    children,
    open = $bindable(false),
    selectedModel,
    onSelectModel,
    byokId = $bindable(undefined),
    onSelectByok,
  }: Props = $props();

  let windowWidth = $state(0);
  const isMobile = $derived(windowWidth < 768);

  $effect(() => {
    if (inputRef) {
      setTimeout(() => {
        inputRef?.focus();
      }, 100);
    }
  });

  const byoks = useBYOKs(null);

  // For now we just a single byok, openrouter. In the future we need to add a menu.
  const openRouterByok = $derived($byoks?.data?.find((byok) => byok.platform === "openrouter"));
  const hasBYOKs = $derived(!!openRouterByok);

  function toggleBYOK() {
    onSelectByok?.(byokId ? undefined : openRouterByok?.id);
  }
</script>

<svelte:window bind:innerWidth={windowWidth} />

{#snippet modelsButton()}
  <CpuIcon class="size-4" />
  Models
  {#if selectedModel}
    <span class="text-muted-foreground text-xs">
      {MODEL_DETAILS[selectedModel].displayName}
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
  {#if hasBYOKs}
    <Switch checked={!!byokId} onchange={toggleBYOK} class="ml-auto" />
  {:else}
    <span class="text-muted-foreground text-xs"> You don't have any BYOKs yet. </span>
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
      <DropdownMenuItem onSelect={toggleBYOK} disabled={!hasBYOKs}>
        {@render byokButton()}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
{/if}
