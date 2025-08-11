<script lang="ts">
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { HelpCircleIcon } from "@lucide/svelte";
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();
</script>

<Tooltip.Provider delayDuration={100}>
  <Tooltip.Root>
    <Tooltip.Trigger>
      <HelpCircleIcon class="size-4" />
    </Tooltip.Trigger>
    <Tooltip.Content>
      {@render children()}
    </Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
