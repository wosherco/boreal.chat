<script lang="ts">
  import { PremiumBadge } from ".";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import type { premiumBadgeVariants } from "./PremiumBadge.svelte";

  interface Props extends VariantProps<typeof premiumBadgeVariants> {
    children: Snippet;
    showBadge?: boolean;
    class?: string;
  }

  let { children, showBadge = false, class: className, ...props }: Props = $props();
</script>

<div class={cn("relative inline-block", className)}>
  {@render children()}

  {#if showBadge}
    <PremiumBadge {...props} />
  {/if}
</div>
