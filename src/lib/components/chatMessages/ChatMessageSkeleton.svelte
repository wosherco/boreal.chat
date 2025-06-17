<script lang="ts">
  import { cn } from "$lib/utils";

  interface Props {
    isUser?: boolean;
  }

  let { isUser = false }: Props = $props();

  // Generate random widths for more realistic appearance
  const generateRandomWidth = (min: number, max: number): string => {
    const widths = [
      "w-16",
      "w-20",
      "w-24",
      "w-28",
      "w-32",
      "w-36",
      "w-40",
      "w-44",
      "w-48",
      "w-52",
      "w-56",
      "w-60",
      "w-64",
      "w-72",
      "w-80",
    ];
    const minIndex = Math.max(0, min);
    const maxIndex = Math.min(widths.length - 1, max);
    const randomIndex = Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex;
    return widths[randomIndex];
  };

  // Generate random number of lines for AI messages (1-4 lines) and user messages (1-2 lines)
  const lineCount = isUser ? Math.floor(Math.random() * 2) + 1 : Math.floor(Math.random() * 4) + 1;
  const lines = Array.from({ length: lineCount }, (_, i) => ({
    id: i,
    width: isUser
      ? generateRandomWidth(4, 8) // User messages: shorter
      : generateRandomWidth(8, 14), // AI messages: longer
  }));
</script>

<div class="group animate-pulse">
  <div
    class={cn(
      isUser
        ? "bg-muted border-input ml-auto w-fit max-w-[80%] rounded-lg border px-4 py-2 shadow-sm"
        : "mr-auto w-fit max-w-[90%]",
    )}
  >
    <!-- Message content skeleton -->
    <div class="space-y-2">
      {#each lines as line (line.id)}
        <div class={cn("h-4 rounded bg-gray-300 dark:bg-gray-600", line.width)}></div>
      {/each}
    </div>
  </div>

  <!-- Action buttons skeleton -->
  <div
    class={cn(
      "flex w-fit flex-row items-center gap-2 pt-2 opacity-0 transition-opacity group-hover:opacity-100",
      isUser ? "ml-auto" : "mr-auto",
    )}
  >
    <!-- Copy button skeleton -->
    <div class="h-8 w-8 rounded bg-gray-300 dark:bg-gray-600"></div>

    {#if isUser}
      <!-- Edit button skeleton -->
      <div class="h-8 w-8 rounded bg-gray-300 dark:bg-gray-600"></div>
    {:else}
      <!-- Regenerate button skeleton -->
      <div class="h-8 w-16 rounded bg-gray-300 dark:bg-gray-600"></div>
    {/if}
  </div>
</div>

<style>
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>
