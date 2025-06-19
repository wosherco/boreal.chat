<script lang="ts">
  import Markdown, { type Plugin } from "svelte-exmarkdown";
  import { gfmPlugin } from "svelte-exmarkdown/gfm";
  import Codeblock from "./Codeblock.svelte";
  import { cn } from "$lib/utils";
  import remarkMath from "remark-math";
  import rehypeKatex from "rehype-katex";
  import "katex/dist/katex.min.css";

  interface Props {
    content: string;
    reasoning?: boolean;
  }

  const { content, reasoning = false }: Props = $props();

  const plugins: Plugin[] = [
    {
      renderer: {
        pre: Codeblock,
      },
    },
    gfmPlugin(),
    { remarkPlugin: [remarkMath], rehypePlugin: [rehypeKatex] },
  ];
</script>

<div
  class={cn(
    reasoning
      ? "text-muted-foreground prose-sm mb-0"
      : "prose dark:prose-invert text-foreground max-w-screen-md",
  )}
>
  <Markdown md={content} {plugins} />
</div>

<style>
  .prose :global(code:not(.not-prose code)) {
    background-color: #1e1e1e;
    color: #f0f0f0;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
  }

  .prose :global(code:not(.not-prose code))::before,
  .prose :global(code:not(.not-prose code))::after {
    content: none;
  }
</style>
