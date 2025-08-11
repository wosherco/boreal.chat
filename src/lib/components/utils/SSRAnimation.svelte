<script lang="ts">
  import { onDestroy, onMount, type Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  let shown = $state(false);

  onMount(() => {
    shown = true;
  });

  onDestroy(() => {
    shown = false;
  });
</script>

{#if shown}
  {@render children()}
{/if}
