<script lang="ts">
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { BrainIcon, CalculatorIcon, CodeIcon, FileTextIcon } from "@lucide/svelte";
  import type { PageProps } from "./$types";
  import type { Component } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import SvelteSeo from "svelte-seo";
  import { goto } from "$app/navigation";

  const { data }: PageProps = $props();

  const currentUser = useCurrentUser(data.auth.currentUserInfo);

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
  <button
    onclick={() => fillText(prompt)}
    class="hover:bg-accent flex cursor-pointer flex-row items-start justify-start gap-2 rounded-md p-2 text-start text-sm"
  >
    <Icon />
    {prompt.prompt}
  </button>
{/snippet}

<div class="flex h-full w-full flex-col items-center justify-center px-4 pb-24">
  {#if $currentUser.data?.authenticated && $currentUser.data?.data}
    <h1 class="text-2xl font-bold">👋 Welcome back, {$currentUser.data.data.name}!</h1>
    <h2 class="text-muted-foreground text-lg">What do you want to do?</h2>

    <div class="flex flex-col items-start gap-1 py-4">
      {#each prewrittenPrompts as prompt (prompt.prompt)}
        {@render prewrittenPrompt(prompt, iconMap[prompt.type])}
      {/each}
    </div>
  {:else}
    <h1 class="text-2xl font-bold">Welcome to boreal.chat!</h1>
    <p class="pt-4">
      The open-source AI chat platform where you can use any model, add web search, and more. Pay
      only for what you use—no subscription required for simple chatting.
    </p>
    <div class="flex justify-center pt-4">
      <Button href="/auth">Sign up Today</Button>
    </div>

    <!-- Landing Page Cards -->
    <div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      <a
        href="/business"
        class="group focus:ring-primary flex h-full flex-col rounded-lg border p-6 shadow transition hover:shadow-lg focus:ring-2 focus:outline-none"
        tabindex="0"
      >
        <div class="flex-1">
          <h2 class="mb-2 text-xl font-semibold">Business</h2>
          <p class="mb-4">
            Discover how boreal.chat can empower your business with advanced AI chat solutions.
          </p>
        </div>
        <div class="mt-2 flex items-center justify-end">
          <span class="text-primary opacity-80 transition-transform group-hover:translate-x-1"
            >→</span
          >
        </div>
      </a>
      <a
        href="/consumer"
        class="group focus:ring-primary flex h-full flex-col rounded-lg border p-6 shadow transition hover:shadow-lg focus:ring-2 focus:outline-none"
        tabindex="0"
      >
        <div class="flex-1">
          <h2 class="mb-2 text-xl font-semibold">Consumer</h2>
          <p class="mb-4">Explore features tailored for individual users and enthusiasts.</p>
        </div>
        <div class="mt-2 flex items-center justify-end">
          <span class="text-primary opacity-80 transition-transform group-hover:translate-x-1"
            >→</span
          >
        </div>
      </a>
      <a
        href="/pricing"
        class="group focus:ring-primary flex h-full flex-col rounded-lg border p-6 shadow transition hover:shadow-lg focus:ring-2 focus:outline-none"
        tabindex="0"
      >
        <div class="flex-1">
          <h2 class="mb-2 text-xl font-semibold">Pricing</h2>
          <p class="mb-4">Check out our simple pricing. Just one paid plan, unlimited usage.</p>
        </div>
        <div class="mt-2 flex items-center justify-end">
          <span class="text-primary opacity-80 transition-transform group-hover:translate-x-1"
            >→</span
          >
        </div>
      </a>
    </div>
  {/if}
</div>
