<script lang="ts">
  import { CrownIcon } from "@lucide/svelte";
  import { cn } from "$lib/utils";

  interface Props {
    variant?: "icon-only" | "with-text";
    class?: string;
  }

  let { variant = "icon-only", class: className }: Props = $props();
</script>

<div
  class={cn(
    "absolute -top-1 -right-1 z-10 flex items-center justify-center rounded-full text-xs font-medium text-white shadow-sm",
    "bg-gradient-to-br from-blue-500 via-teal-500 to-green-500",
    "animate-pulse",
    variant === "icon-only" ? "h-4 w-4 p-0" : "h-5 px-2 py-0.5 gap-1",
    className,
  )}
>
  <CrownIcon class={cn("h-3 w-3", variant === "icon-only" ? "h-2.5 w-2.5" : "")} />
  {#if variant === "with-text"}
    <span class="text-[10px] font-semibold uppercase tracking-wide">Unlimited</span>
  {/if}
</div>