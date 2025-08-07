<script lang="ts" module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import ReasoningSegment from "$lib/components/chatMessages/ReasoningSegment.svelte";
  import { onDestroy, onMount } from "svelte";

  const { Story } = defineMeta({
    title: "Chat/Reasoning Segment",
    component: ReasoningSegment,
    argTypes: {
      reasoning: {
        control: "text",
        description: "The reasoning content to display (Markdown supported)",
      },
      streaming: {
        control: "boolean",
        description: "Whether the reasoning is currently being streamed",
      },
      state: {
        control: "select",
        options: ["default", "closed", "open"],
        description: "The current state of the reasoning segment",
      },
    },
  });

  const shortReasoning = `Let me think about this step by step:

1. First, I need to understand the user's question
2. Then analyze the available information
3. Finally, provide a clear answer`;

  const longReasoning = `Let me work through this complex problem systematically:

## Initial Analysis

I need to carefully consider multiple factors here:

1. **Technical Requirements**
   - The system needs to handle real-time data processing
   - Performance constraints are critical
   - Scalability must be considered from the start

2. **User Experience Considerations**
   - The interface should be intuitive
   - Response times must be minimal
   - Error handling needs to be graceful

## Detailed Breakdown

### Performance Optimization
- Implement caching strategies
- Use efficient data structures
- Consider lazy loading for large datasets

### Architecture Decisions
- Microservices vs monolithic approach
- Database selection criteria
- API design principles

### Testing Strategy
- Unit tests for core functionality
- Integration tests for system interactions
- End-to-end tests for user workflows

## Conclusion

Based on this analysis, I recommend proceeding with a hybrid approach that balances performance, maintainability, and user experience. The implementation should be done in phases to allow for iterative improvements and user feedback.`;

  const codeReasoning = `Let me analyze this code problem:

\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`

**Issues with this approach:**
1. **Exponential time complexity** - O(2^n)
2. **Redundant calculations** - same values computed multiple times
3. **Stack overflow risk** for large inputs

**Better solution using memoization:**

\`\`\`javascript
function fibonacci(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}
\`\`\`

This reduces time complexity to O(n) and space complexity to O(n).`;
</script>

<script lang="ts">
  const words = [
    "analyzing",
    "processing",
    "computing",
    "evaluating",
    "considering",
    "examining",
    "investigating",
    "researching",
    "studying",
    "exploring",
    "hypothesizing",
    "theorizing",
    "deducing",
    "inferring",
    "concluding",
  ];

  function getRandomWord() {
    return words[Math.floor(Math.random() * words.length)];
  }

  let streamedReasoning = $state("");
  let interval = $state<NodeJS.Timeout>();

  function streamReasoning() {
    streamedReasoning += getRandomWord();
  }

  onMount(() => {
    setInterval(streamReasoning, 20);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<Story
  name="Default State"
  tags={["autodocs"]}
  args={{
    reasoning: shortReasoning,
    streaming: false,
    state: "default",
  }}
>
  {#snippet template(args)}
    <div class="max-w-2xl p-4">
      <div class="bg-background rounded-lg border p-4">
        <ReasoningSegment {...args} />
      </div>
    </div>
  {/snippet}
</Story>

<Story
  name="Streaming"
  tags={["autodocs"]}
  args={{
    reasoning: shortReasoning,
    streaming: true,
    state: "default",
  }}
>
  {#snippet template(args)}
    <div class="max-w-2xl p-4">
      <div class="bg-background rounded-lg border p-4">
        <ReasoningSegment {...args} />
      </div>
      <p class="text-muted-foreground mt-2 text-sm">
        Note: In streaming mode, the component auto-scrolls and shows "Reasoning..." text
      </p>
    </div>
  {/snippet}
</Story>

<Story
  name="Closed State"
  tags={["autodocs"]}
  args={{
    reasoning: longReasoning,
    streaming: false,
    state: "closed",
  }}
>
  {#snippet template(args)}
    <div class="max-w-2xl p-4">
      <div class="bg-background rounded-lg border p-4">
        <ReasoningSegment {...args} />
      </div>
      <p class="text-muted-foreground mt-2 text-sm">Click the chevron or left border to expand</p>
    </div>
  {/snippet}
</Story>

<Story
  name="Open State"
  tags={["autodocs"]}
  args={{
    reasoning: longReasoning,
    streaming: false,
    state: "open",
  }}
>
  {#snippet template(args)}
    <div class="max-w-2xl p-4">
      <div class="bg-background rounded-lg border p-4">
        <ReasoningSegment {...args} />
      </div>
      <p class="text-muted-foreground mt-2 text-sm">Click the chevron or left border to collapse</p>
    </div>
  {/snippet}
</Story>

<Story
  name="With Code"
  tags={["autodocs"]}
  args={{
    reasoning: codeReasoning,
    streaming: false,
    state: "open",
  }}
>
  {#snippet template(args)}
    <div class="max-w-4xl p-4">
      <div class="bg-background rounded-lg border p-4">
        <ReasoningSegment {...args} />
      </div>
      <p class="text-muted-foreground mt-2 text-sm">
        Reasoning segments support full Markdown including code blocks
      </p>
    </div>
  {/snippet}
</Story>

<Story name="Interactive Demo" tags={["autodocs"]}>
  {#snippet template()}
    <div class="max-w-4xl space-y-6 p-4">
      <h3 class="text-lg font-semibold">Interactive Reasoning Segment Demo</h3>

      <!-- Short reasoning example -->
      <div class="space-y-2">
        <h4 class="font-medium">Short Reasoning (Default → Closed on completion)</h4>
        <div class="bg-background rounded-lg border p-4">
          <ReasoningSegment reasoning={shortReasoning} streaming={false} />
        </div>
      </div>

      <!-- Long reasoning example -->
      <div class="space-y-2">
        <h4 class="font-medium">Long Reasoning (Expandable)</h4>
        <div class="bg-background rounded-lg border p-4">
          <ReasoningSegment reasoning={longReasoning} streaming={false} />
        </div>
      </div>

      <!-- Streaming simulation -->
      <div class="space-y-2">
        <h4 class="font-medium">Streaming Simulation</h4>
        <div class="bg-background rounded-lg border p-4">
          <ReasoningSegment reasoning={codeReasoning} streaming={true} />
        </div>
      </div>

      <div class="bg-muted rounded-lg p-4 text-sm">
        <h4 class="mb-2 font-medium">Interaction Guide:</h4>
        <ul class="space-y-1">
          <li>• Click the chevron icon to toggle between open/closed states</li>
          <li>• Click the left border (gray bar) to toggle expansion</li>
          <li>• Streaming segments auto-close when streaming stops</li>
          <li>• Height is limited during streaming to prevent overwhelming content</li>
          <li>• Opening manually scrolls to top for better readability</li>
        </ul>
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Height Limiting Demo" tags={["autodocs"]}>
  {#snippet template()}
    <div class="max-w-2xl space-y-6 p-4">
      <h3 class="text-lg font-semibold">Height Limiting Behavior</h3>

      <div class="space-y-4">
        <div class="space-y-2">
          <h4 class="font-medium">Streaming (Height Limited to 200px)</h4>
          <div class="bg-background rounded-lg border p-4">
            <ReasoningSegment reasoning={longReasoning} streaming={true} state="default" />
          </div>
        </div>

        <div class="space-y-2">
          <h4 class="font-medium">Open (Full Height)</h4>
          <div class="bg-background rounded-lg border p-4">
            <ReasoningSegment reasoning={longReasoning} streaming={false} state="open" />
          </div>
        </div>
      </div>

      <div class="bg-muted rounded-lg p-4 text-sm">
        <p>
          During streaming, content height is limited to 200px with scrolling. When manually opened,
          the full content height is shown.
        </p>
      </div>
    </div>
  {/snippet}
</Story>

<Story
  name="Live Streaming Demo"
  tags={["autodocs"]}
  args={{ streaming: true, reasoning: streamedReasoning }}
>
  {#snippet template()}
    <div class="max-w-2xl space-y-6 p-4">
      <h3 class="text-lg font-semibold">Live Streaming Demo</h3>
      <div class="space-y-2">
        <div class="bg-background rounded-lg border p-4">
          <ReasoningSegment reasoning={streamedReasoning} streaming={true} />
        </div>
        <p class="text-muted-foreground mt-2 text-sm">
          Watch as random words are appended every 100ms
        </p>
      </div>
    </div>
  {/snippet}
</Story>
