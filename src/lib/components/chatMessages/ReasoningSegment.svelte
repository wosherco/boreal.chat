<script lang="ts">
  import { ChevronDownIcon, ChevronUpIcon } from "@lucide/svelte";
  import { onMount } from "svelte";
  import Markdown from "../markdown/Markdown.svelte";

  interface Props {
    reasoning: string;
    isReasoning?: boolean;
    /**
     * @bindable
     */
    collapsed?: boolean;
  }

  let {
    reasoning,
    isReasoning = $bindable(false),
    collapsed = $bindable(isReasoning === false),
  }: Props = $props();

  function toggleCollapsed() {
    collapsed = !collapsed;
  }

  let reasoningRef: HTMLParagraphElement;
  let containerRef: HTMLDivElement;
  let naturalHeight = $state<number>(0);

  function updateNaturalHeight() {
    if (reasoningRef) {
      naturalHeight = reasoningRef.scrollHeight;
    }
  }

  function handleResize() {
    // Small delay to ensure DOM has updated after resize
    setTimeout(updateNaturalHeight, 0);
  }

  onMount(() => {
    updateNaturalHeight();
  });

  // Update natural height when reasoning content changes
  $effect(() => {
    if (reasoningRef && reasoning) {
      handleResize();
    }
  });
</script>

<svelte:window on:resize={handleResize} />

<button
  onclick={toggleCollapsed}
  class="text-muted-foreground hover:text-foreground flex flex-row items-center gap-2 text-sm"
>
  {#if isReasoning}
    <p>Reasoning...</p>
  {:else}
    <p>Reasoned</p>
  {/if}

  {#if collapsed}
    <ChevronDownIcon class="size-4" />
  {:else}
    <ChevronUpIcon class="size-4" />
  {/if}
</button>

<div
  bind:this={containerRef}
  class="overflow-hidden transition-all duration-300 ease-in-out"
  style="height: {collapsed ? '0px' : `${naturalHeight}px`}"
>
  <div class="text-muted-foreground text-sm" bind:this={reasoningRef}>
    <Markdown content={reasoning} reasoning={true} />
  </div>
</div>
