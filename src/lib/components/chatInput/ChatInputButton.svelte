<script lang="ts">
  import { cn } from "$lib/utils";
  import { type Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props {
    children?: Snippet;
  }

  const { children, class: className, ...props }: HTMLButtonAttributes = $props();
</script>

<button
  class={cn(
    "bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-8 w-auto min-w-8 items-center justify-center gap-1 overflow-hidden rounded-full border p-0 px-2 text-sm leading-none transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4",
    className,
  )}
  {...props}
>
  {@render children?.()}
</button>
