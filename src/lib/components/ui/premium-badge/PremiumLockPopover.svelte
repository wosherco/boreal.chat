<script lang="ts">
  import type { Snippet } from "svelte";
  import { Popover, PopoverContent, PopoverTrigger } from "../popover";
  import { Button } from "../button";
  import { LockIcon, SparklesIcon } from "@lucide/svelte";

  interface Props {
    children: Snippet;
    /** Optional: override target href for subscribe action */
    subscribeHref?: string;
    /** Optional: control popover externally */
    open?: boolean;
  }

  let { children, subscribeHref, open = $bindable(false) }: Props = $props();
</script>

<Popover bind:open>
  <PopoverTrigger>
    {@render children()}
  </PopoverTrigger>
  <PopoverContent class="w-80">
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <LockIcon class="text-muted-foreground h-4 w-4" />
        <span class="font-medium">Premium feature</span>
      </div>
      <p class="text-muted-foreground text-sm">
        This feature is available on the Unlimited plan. Subscribe to unlock it.
      </p>
      <Button class="w-full" href={subscribeHref ?? "/settings/billing"}>
        <SparklesIcon class="mr-2 h-4 w-4" />
        Subscribe
      </Button>
    </div>
  </PopoverContent>
</Popover>
