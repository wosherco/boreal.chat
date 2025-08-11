<script lang="ts">
  import type { Snippet } from "svelte";
  import { Popover, PopoverContent, PopoverTrigger } from "../popover";
  import { Button } from "../button";
  import { LockIcon, SparklesIcon } from "@lucide/svelte";
  import { BILLING_ENABLED } from "$lib/common/constants";
  import { goto } from "$app/navigation";

  interface Props {
    children: Snippet;
    /** Optional: override target href for subscribe action */
    subscribeHref?: string;
    /** Optional: control popover externally */
    open?: boolean;
  }

  let { children, subscribeHref, open = $bindable(false) }: Props = $props();

  function onSubscribe() {
    // Prefer settings billing when billing is enabled, else fallback to pricing or auth
    if (BILLING_ENABLED) {
      goto(subscribeHref ?? "/settings/billing");
      return;
    }
    goto(subscribeHref ?? "/pricing");
  }
</script>

<Popover bind:open>
  <PopoverTrigger>
    {@render children()}
  </PopoverTrigger>
  <PopoverContent class="w-80">
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <LockIcon class="h-4 w-4 text-muted-foreground" />
        <span class="font-medium">Premium feature</span>
      </div>
      <p class="text-sm text-muted-foreground">
        This feature is available on the Unlimited plan. Subscribe to unlock it.
      </p>
      <Button class="w-full" onclick={onSubscribe}>
        <SparklesIcon class="mr-2 h-4 w-4" />
        Subscribe
      </Button>
    </div>
  </PopoverContent>
</Popover>