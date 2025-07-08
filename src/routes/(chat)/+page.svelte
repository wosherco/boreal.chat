<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import type { PageProps } from "./$types";
  import {
    ArrowRightIcon,
    MessageSquareIcon,
    CodeIcon,
    GlobeIcon,
    CalculatorIcon,
    FileTextIcon,
  } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import * as m from "$lib/paraglide/messages";

  const { data }: PageProps = $props();

  const currentUser = useCurrentUser(data.auth.currentUserInfo);

  const prewrittenPrompts = [
    {
      prompt: "Write a Python script to calculate the fibonacci sequence",
      type: "code" as const,
    },
    {
      prompt: "What are the latest news about AI?",
      type: "search" as const,
    },
    {
      prompt: "Analyze this data and create a visualization",
      type: "data" as const,
    },
    {
      prompt: "Write a business proposal for a sustainable tech startup",
      type: "writing" as const,
    },
  ];

  const iconMap = {
    code: CodeIcon,
    search: GlobeIcon,
    data: CalculatorIcon,
    writing: FileTextIcon,
  };

  function onPromptClick(prompt: string) {
    goto(`/?prompt=${encodeURIComponent(prompt)}&forcePrompt=true`);
  }
</script>

{#snippet prewrittenPrompt(prompt: (typeof prewrittenPrompts)[0], Icon: any)}
  <button
    class="bg-muted/50 hover:bg-muted flex w-full flex-row items-center gap-3 rounded-lg border p-4 text-left transition-colors"
    onclick={() => onPromptClick(prompt.prompt)}
  >
    <Icon class="text-muted-foreground h-5 w-5 shrink-0" />
    <span class="flex-1 text-sm">{prompt.prompt}</span>
    <ArrowRightIcon class="text-muted-foreground h-4 w-4 shrink-0" />
  </button>
{/snippet}

<div class="flex h-full w-full flex-col items-center justify-center px-4 pb-24">
  {#if $currentUser.data?.authenticated && $currentUser.data?.data}
    <h1 class="text-2xl font-bold">{m.auth_welcomeBack({ name: $currentUser.data.data.name })}</h1>
    <h2 class="text-muted-foreground text-lg">{m.chat_whatDoYouWantToDo()}</h2>

    <div class="flex flex-col items-start gap-1 py-4">
      {#each prewrittenPrompts as prompt (prompt.prompt)}
        {@render prewrittenPrompt(prompt, iconMap[prompt.type])}
      {/each}
    </div>
  {:else}
    <h1 class="text-2xl font-bold">{m.chat_welcomeTitle()}</h1>
    <ul class="list-inside list-disc space-y-2 pt-4">
      <li>{m.chat_welcomeFeature1()}</li>
      <li>{m.chat_welcomeFeature2()}</li>
      <li>{m.chat_welcomeFeature3()}</li>
      <li>{m.chat_welcomeFeature4()}</li>
    </ul>
    <div class="flex justify-center pt-4">
      <Button href="/auth">{m.auth_signUp()}</Button>
    </div>
  {/if}
</div>
