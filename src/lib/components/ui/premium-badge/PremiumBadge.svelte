<script lang="ts" module>
  import { cn } from "$lib/utils";
  import { type VariantProps, tv } from "tailwind-variants";

  export const premiumBadgeVariants = tv({
    base: "absolute -top-1 -right-1 z-10 flex flex-row items-center justify-center rounded-full text-xs font-medium text-white shadow-sm",
    defaultVariants: {
      variant: "icon-only",
      color: "gradient",
    },
    variants: {
      variant: {
        "icon-only": "h-4 w-4 p-0",
        "with-text": "h-5 px-2 py-0.5 gap-1",
      },
      color: {
        gradient: "bg-gradient-to-br from-blue-500 via-teal-500 to-green-500",
      },
    },
  });

  export interface PremiumBadgeProps extends VariantProps<typeof premiumBadgeVariants> {
    class?: string;
  }
</script>

<script lang="ts">
  import { SparklesIcon } from "@lucide/svelte";

  let { variant, color, class: className }: PremiumBadgeProps = $props();
</script>

<div class={premiumBadgeVariants({ variant, color, className })}>
  <SparklesIcon class={cn("h-3 w-3", variant === "icon-only" ? "h-2.5 w-2.5" : "")} />
  {#if variant === "with-text"}
    <span class="text-[10px] leading-none font-semibold tracking-wide uppercase">Unlimited</span>
  {/if}
</div>
