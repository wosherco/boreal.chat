<script lang="ts">
  import { Coins, Plus } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip";
  import { cn } from "$lib/utils";
  import { isSubscribed } from "$lib/common/utils/subscription";
  import { BILLING_ENABLED } from "$lib/common/constants";

  interface Props {
    user: any;
    credits?: number;
    onBuyCredits?: () => void;
    compact?: boolean;
    className?: string;
  }

  let { user, credits = 0, onBuyCredits, compact = false, className }: Props = $props();

  const userSubscribed = $derived(isSubscribed(user));
  const showCredits = $derived(BILLING_ENABLED && !userSubscribed);
  const lowCredits = $derived(credits < 10);
  const veryLowCredits = $derived(credits < 5);
</script>

{#if showCredits}
  <div class={cn("flex items-center gap-2", className)}>
    {#if compact}
      <!-- Compact version for sidebar -->
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="sm"
            class={cn(
              "h-8 gap-1 px-2",
              veryLowCredits && "text-red-600 dark:text-red-400",
              lowCredits && !veryLowCredits && "text-orange-600 dark:text-orange-400"
            )}
            onclick={onBuyCredits}
          >
            <Coins class="h-4 w-4" />
            <span class="text-sm font-medium">{credits}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p class="text-sm">
            {credits} credits remaining
            {#if veryLowCredits}
              <br />
              <span class="text-red-400">Very low! Buy more credits</span>
            {:else if lowCredits}
              <br />
              <span class="text-orange-400">Running low</span>
            {/if}
          </p>
        </TooltipContent>
      </Tooltip>
    {:else}
      <!-- Full version for main UI -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1">
          <Coins class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm font-medium">{credits}</span>
          <span class="text-xs text-muted-foreground">credits</span>
        </div>
        
        {#if veryLowCredits}
          <Badge variant="destructive" class="text-xs">Very Low</Badge>
        {:else if lowCredits}
          <Badge variant="secondary" class="text-xs">Low</Badge>
        {/if}
        
        {#if onBuyCredits}
          <Button
            variant="outline"
            size="sm"
            class="h-7 gap-1 px-2"
            onclick={onBuyCredits}
          >
            <Plus class="h-3 w-3" />
            <span class="text-xs">Buy</span>
          </Button>
        {/if}
      </div>
    {/if}
  </div>
{/if}