<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { CheckCircle, Zap, ArrowRight, Coins } from "@lucide/svelte";
  import SvelteSeo from "svelte-seo";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";

  // Check if this is a credit purchase
  const isCredits = $derived(page.url.searchParams.get("type") === "credits");

  // Redirect to main chat after a few seconds
  onMount(() => {
    const timer = setTimeout(() => {
      goto("/");
    }, 15000); // 15 seconds - more time to read

    return () => clearTimeout(timer);
  });
</script>

<SvelteSeo
  title={isCredits ? "Credits Added! | boreal.chat" : "Welcome to PRO! | boreal.chat"}
  description={isCredits ? "Your credits have been added successfully." : "Your subscription is now active. Start using all PRO features today."}
/>

<div class="flex min-h-screen items-center justify-center p-4">
  <div class="w-full max-w-md space-y-12 text-center">
    <!-- Success Icon -->
    <div
      class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
    >
      {#if isCredits}
        <Coins class="h-16 w-16 text-green-600 dark:text-green-400" />
      {:else}
        <CheckCircle class="h-16 w-16 text-green-600 dark:text-green-400" />
      {/if}
    </div>

    <!-- Header -->
    <div class="space-y-4">
      {#if isCredits}
        <h1 class="text-4xl font-bold tracking-tight">🎉 Credits Added!</h1>
        <p class="text-muted-foreground text-xl">Your credits have been successfully added to your account.</p>
      {:else}
        <h1 class="text-4xl font-bold tracking-tight">🎉 Welcome to PRO!</h1>
        <p class="text-muted-foreground text-xl">Your subscription is now active.</p>
      {/if}
    </div>

    <!-- Features List -->
    {#if isCredits}
      <div class="space-y-6">
        <h2 class="text-lg font-semibold">What you can do with credits:</h2>
        <div class="space-y-4 text-left">
          <div class="flex items-center gap-3">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
            >
              <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span>Send AI messages (1 credit per message)</span>
          </div>
          <div class="flex items-center gap-3">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
            >
              <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span>Use any AI model available</span>
          </div>
          <div class="flex items-center gap-3">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
            >
              <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span>Access web search features</span>
          </div>
          <div class="flex items-center gap-3">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
            >
              <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span>Credits never expire</span>
          </div>
        </div>
      </div>
    {:else}
      <div class="space-y-6">
        <h2 class="text-lg font-semibold">You now have access to:</h2>
        <div class="space-y-4 text-left">
          <div class="flex items-center gap-3">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
            >
              <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span>Unlimited requests & files*</span>
          </div>
          <div class="flex items-center gap-3">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
            >
              <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span>Advanced web searching</span>
          </div>
          <div class="flex items-center gap-3">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
            >
              <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span>Advanced data analysis</span>
          </div>
          <div class="flex items-center gap-3">
            <div
              class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
            >
              <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span>Projects & more</span>
          </div>
        </div>
        <p class="text-muted-foreground text-sm">*Fair rate limits applied</p>
      </div>
    {/if}

    <!-- Primary CTA -->
    <div class="space-y-4">
      <Button
        href="/"
        class="from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground w-full bg-gradient-to-r shadow-lg"
        size="lg"
      >
        {#if isCredits}
          <Coins class="mr-2 h-4 w-4" />
          Start Chatting
        {:else}
          <Zap class="mr-2 h-4 w-4" />
          Start Using PRO Features
        {/if}
        <ArrowRight class="ml-2 h-4 w-4" />
      </Button>

      <p class="text-muted-foreground text-sm">Redirecting automatically in a few seconds...</p>
    </div>

    <!-- Support -->
    <p class="text-muted-foreground text-sm">
      Questions? <a href="/settings/contact" class="text-primary hover:underline">Contact support</a
      >
    </p>
  </div>
</div>
