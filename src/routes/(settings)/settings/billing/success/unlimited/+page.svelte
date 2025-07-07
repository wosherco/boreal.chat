<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { CheckCircle, ArrowRight, InfinityIcon } from "@lucide/svelte";
  import SvelteSeo from "svelte-seo";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  // Redirect to main chat after a few seconds
  onMount(() => {
    const timer = setTimeout(() => {
      goto("/");
    }, 15000); // 15 seconds - more time to read

    return () => clearTimeout(timer);
  });
</script>

<SvelteSeo
  title="Welcome to Unlimited! | boreal.chat"
  description="Your Unlimited subscription is now active. Enjoy unlimited access to all features."
/>

<div class="flex min-h-screen items-center justify-center p-4">
  <div class="w-full max-w-md space-y-12 text-center">
    <!-- Success Icon -->
    <div
      class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
    >
      <CheckCircle class="h-16 w-16 text-green-600 dark:text-green-400" />
    </div>

    <!-- Header -->
    <div class="space-y-4">
      <h1 class="text-4xl font-bold tracking-tight">🚀 Welcome to Unlimited!</h1>
      <p class="text-muted-foreground text-xl">Your Unlimited subscription is now active.</p>
    </div>

    <!-- Features List -->
    <div class="space-y-6">
      <h2 class="text-lg font-semibold">You now have access to:</h2>
      <div class="space-y-4 text-left">
        <div class="flex items-center gap-3">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
          >
            <InfinityIcon class="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span
            ><strong>Unlimited Messages</strong>
            <small class="text-muted-foreground">(fair rate limits applied)</small></span
          >
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
          >
            <InfinityIcon class="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span
            ><strong>Unlimited storage</strong>
            <small class="text-muted-foreground">(fair rate limits applied)</small></span
          >
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
          >
            <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span>Advanced Web Searching</span>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
          >
            <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span>Advanced Data Analysis</span>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
          >
            <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span>Advanced Projects</span>
        </div>
      </div>
      <p class="text-muted-foreground text-sm">Plus everything from the Premium plan</p>
    </div>

    <!-- Primary CTA -->
    <div class="space-y-4">
      <Button
        href="/"
        class="from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground w-full bg-gradient-to-r shadow-lg"
        size="lg"
      >
        <InfinityIcon class="mr-2 h-4 w-4" />
        Start Using Unlimited Features
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
