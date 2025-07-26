<script lang="ts">
  import { type ModelId } from "$lib/common/ai/models";
  import type { Snippet } from "svelte";
  import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
  import ModelPickerPopoverContent from "./ModelPickerPopoverContent.svelte";

  interface Props {
    children?: Snippet;
    /**
     * @bindable
     */
    open?: boolean;
    /**
     * @bindable
     */
    selectedModel: ModelId;
    onSelect?: (modelId: ModelId) => void;
    /**
     * @bindable
     */
    inputRef: HTMLInputElement | null;
  }

  let {
    children,
    selectedModel = $bindable(),
    onSelect,
    open = $bindable(false),
    inputRef = $bindable(null),
  }: Props = $props();
</script>

<Popover bind:open>
  <PopoverTrigger>
    {@render children?.()}
  </PopoverTrigger>
  <PopoverContent class="w-80 p-0">
    <ModelPickerPopoverContent bind:open {selectedModel} {onSelect} {inputRef} />
  </PopoverContent>
</Popover>
