<script lang="ts">
  import type { Snippet } from "svelte";
  import { SheetClose } from "../ui/sheet";

  interface Props {
    children: Snippet;
    isPhone: boolean;
    class?: string;
  }

  const { children, isPhone, class: className }: Props = $props();
</script>

{#if isPhone}
  <SheetClose class={className}>
    {@render children()}
  </SheetClose>
{:else}
  <div class={className}>
    {@render children()}
  </div>
{/if}
