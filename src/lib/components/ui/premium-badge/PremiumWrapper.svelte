<script lang="ts">
  import { PremiumBadge } from ".";
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    showBadge?: boolean;
    badgeVariant?: "icon-only" | "with-text";
    class?: string;
  }

  let { 
    children, 
    showBadge = false, 
    badgeVariant = "icon-only", 
    class: className 
  }: Props = $props();
</script>

<div class={cn("relative inline-block", className)}>
  {@render children()}
  
  {#if showBadge}
    <PremiumBadge variant={badgeVariant} />
  {/if}
</div>