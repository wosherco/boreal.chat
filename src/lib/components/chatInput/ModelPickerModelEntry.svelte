<script lang="ts">
  import { MODEL_DETAILS } from "$lib/common/ai/models";
  import type { ModelId } from "$lib/common/ai/models";
  import { isReasoningModel, isFreeModel } from "$lib/common/ai/modelFeatures";
  import { BrainIcon, DollarSignIcon } from "@lucide/svelte";
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
  import { ICON_MAP } from "../icons/iconMap";

  interface Props {
    model: ModelId;
  }

  let { model }: Props = $props();

  const modelDetails = $derived(MODEL_DETAILS[model]);
  const Icon = $derived(ICON_MAP[model]);
</script>

<TooltipProvider>
  <div class="flex w-full flex-row items-center gap-2">
    <Icon class="size-4 flex-shrink-0" />
    <span class="w-full text-sm font-medium text-ellipsis">{modelDetails.displayName}</span>
    {#if isReasoningModel(model)}
      <Tooltip>
        <TooltipTrigger>
          <span class="flex size-5 items-center justify-center rounded-sm bg-purple-300/70">
            <BrainIcon class="size-3 stroke-purple-800" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>This model supports reasoning.</p>
        </TooltipContent>
      </Tooltip>
    {/if}
    {#if isFreeModel(model)}
      <Tooltip>
        <TooltipTrigger>
          <span class="flex size-5 items-center justify-center rounded-sm bg-green-300/70">
            <DollarSignIcon class="size-3 stroke-green-800" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>This model can be used for free.</p>
        </TooltipContent>
      </Tooltip>
    {/if}
  </div>
</TooltipProvider>
