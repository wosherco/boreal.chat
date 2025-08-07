<script lang="ts" module>
  export type ReasoningSegmentState = "default" | "closed" | "open";
  export const MAX_STREAMING_HEIGHT = 200;
</script>

<script lang="ts">
  import { ChevronDownIcon } from "@lucide/svelte";
  import Markdown from "../markdown/Markdown.svelte";
  import { cn } from "$lib/utils";
  import { useResizeObserver } from "runed";
  import { StickToBottom } from "stick-to-bottom-svelte";
  import { fade } from "svelte/transition";

  interface Props {
    reasoning: string;
    streaming?: boolean;
    /**
     * @bindable
     */
    state?: ReasoningSegmentState;
  }

  let {
    reasoning,
    streaming = $bindable(false),
    state: currentState = $bindable("default"),
  }: Props = $props();

  function cycleThroughStates() {
    switch (currentState) {
      case "default":
      case "closed":
        currentState = "open";
        break;
      case "open":
        currentState = "closed";
        break;
    }
  }

  let reasoningRef = $state<HTMLDivElement>();
  let containerRef = $state<HTMLDivElement>();
  // svelte-ignore state_referenced_locally
  let reasoningHeight = $state(reasoningRef?.clientHeight ?? 0);

  // Auto-close when streaming stops and in default state
  $effect(() => {
    if (!streaming && currentState === "default") {
      currentState = "closed";
    }
  });

  // Scroll to top when opening manually
  $effect(() => {
    if (currentState === "open" && containerRef) {
      containerRef.scrollTop = 0;
    }
  });

  // Computed properties
  const isCollapsed = $derived(currentState === "closed");
  const isDefault = $derived(currentState === "default");

  useResizeObserver(
    () => reasoningRef,
    ([rect]) => {
      reasoningHeight = rect.contentRect.height;
    },
  );

  // Calculate display height based on state
  const displayHeight = $derived.by(() => {
    if (isCollapsed) return 0;
    if (isDefault && streaming) return MAX_STREAMING_HEIGHT;
    return reasoningHeight;
  });

  const autoScroll = new StickToBottom({
    contentElement: () => containerRef,
    scrollElement: () => containerRef,
    initial: "instant",
    targetScrollTop: (val) => (streaming && isDefault ? val : 0),
  });
</script>

<button
  onclick={cycleThroughStates}
  class="text-muted-foreground hover:text-foreground flex flex-row items-center gap-2 pb-2 text-sm"
>
  {#if streaming}
    <p>Reasoning...</p>
  {:else}
    <p>Reasoned</p>
  {/if}

  <ChevronDownIcon class={cn("size-4 transition-transform", isCollapsed && "-rotate-90")} />
</button>

<div class="relative">
  <button
    onclick={cycleThroughStates}
    class="bg-muted-foreground/30 hover:bg-muted-foreground/50 absolute top-0 left-0 z-10 h-full w-1 cursor-pointer transition-colors"
    aria-label="Toggle reasoning section"
  ></button>

  <div
    bind:this={containerRef}
    class={cn(
      "h-full transition-all duration-300 ease-in-out",
      isDefault && streaming ? "overflow-y-auto" : "overflow-hidden",
    )}
    style={`max-height: ${displayHeight}px;`}
  >
    <div class="text-muted-foreground pl-4 text-sm" bind:this={reasoningRef}>
      <Markdown content={reasoning} reasoning={true} />
    </div>
  </div>

  {#if isDefault && streaming && !autoScroll.isAtBottom}
    <button
      class="from-background absolute bottom-0 left-0 z-10 flex w-full items-center justify-center bg-gradient-to-t to-transparent p-2"
      onclick={() =>
        autoScroll.scrollToBottom({
          animation: "smooth",
        })}
      in:fade={{ duration: 100 }}
    >
      <ChevronDownIcon class="size-4" />
    </button>
  {/if}
</div>
