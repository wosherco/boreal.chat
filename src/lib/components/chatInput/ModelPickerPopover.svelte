<script lang="ts">
  import type { Snippet } from "svelte";
  import { MODELS, type ModelId } from "$lib/common/ai/models";
  import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
  import * as Command from "../ui/command";
  import ModelPickerModelEntry from "./ModelPickerModelEntry.svelte";

  interface Props {
    children: Snippet;
    /**
     * @bindable
     */
    open?: boolean;
    /**
     * @bindable
     */
    selectedModel: ModelId;
    onSelect?: (modelId: ModelId) => void;
  }

  let {
    children,
    selectedModel = $bindable(),
    onSelect,
    open = $bindable(false),
  }: Props = $props();
</script>

<Popover bind:open>
  <PopoverTrigger>
    {@render children()}
  </PopoverTrigger>
  <PopoverContent class="w-80 p-0">
    <Command.Root>
      <Command.Input placeholder="Search model..." />
      <Command.List>
        <Command.Empty>No framework found.</Command.Empty>
        <Command.Group>
          {#each MODELS as model}
            <Command.Item
              value={model}
              onSelect={() => {
                selectedModel = model;
                onSelect?.(model);
                open = false;
              }}
            >
              <ModelPickerModelEntry {model} />
            </Command.Item>
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </PopoverContent>
</Popover>
