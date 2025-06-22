<script lang="ts">
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { BrainIcon, CalculatorIcon, CodeIcon, FileTextIcon } from "@lucide/svelte";
  import type { PageProps } from "./$types";
  import type { Component } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import SvelteSeo from "svelte-seo";
  import { goto } from "$app/navigation";

  const { data }: PageProps = $props();

  const currentUser = $derived(useCurrentUser(data.auth.currentUserInfo));

  interface PrewrittenPrompt {
    prompt: string;
    type: "code" | "writing" | "creative" | "math";
  }

  const iconMap: Record<PrewrittenPrompt["type"], Component> = {
    code: CodeIcon,
    writing: FileTextIcon,
    creative: BrainIcon,
    math: CalculatorIcon,
  };

  const prewrittenPrompts: PrewrittenPrompt[] = [
    {
      prompt: "Write a story for a video game about a cat doing platforming",
      type: "writing",
    },
    {
      prompt: "Code a BFS tree traversal algorithm in Python",
      type: "code",
    },
    {
      prompt: "Create me 5 different ideas for a video game",
      type: "creative",
    },
    {
      prompt: "Lay down the basic equations for a simple physics simulation",
      type: "math",
    },
  ];

  function fillText(selectedText: PrewrittenPrompt) {
    goto(`/?prompt=${selectedText.prompt}&forcePrompt`);
  }
</script>

<SvelteSeo title="🌌 boreal.chat" description="Fast, reliable AI chat with open-source freedom" />

{#snippet prewrittenPrompt(prompt: PrewrittenPrompt, Icon: Component)}
  <Button onclick={() => fillText(prompt)} variant="ghost">
    <Icon />
    {prompt.prompt}
  </Button>
{/snippet}

<div class="flex h-full w-full flex-col items-center justify-center pb-24">
  {#if $currentUser.data}
    <h1 class="text-2xl font-bold">👋 Welcome back, {$currentUser.data?.name}!</h1>
    <h2 class="text-muted-foreground text-lg">What do you want to do?</h2>

    <div class="flex flex-col items-start gap-1 py-4">
      {#each prewrittenPrompts as prompt (prompt.prompt)}
        {@render prewrittenPrompt(prompt, iconMap[prompt.type])}
      {/each}
    </div>
  {:else}
    <h1 class="text-2xl font-bold">Welcome to boreal.chat!</h1>
    <ul class="list-inside list-disc space-y-2 pt-4">
      <li>The upcoming best AI chat platform.</li>
      <li>Use any model you want, and add web search, and more!</li>
      <li>Pay for what you use, no subscription required for simple chatting.</li>
      <li>Completely open-source.</li>
    </ul>
    <div class="flex justify-center pt-4">
      <Button href="/auth">Sign up Today</Button>
    </div>
  {/if}
</div>
