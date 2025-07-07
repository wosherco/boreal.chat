<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { CheckCircle, Zap, ArrowRight, Coins } from "@lucide/svelte";
  import SvelteSeo from "svelte-seo";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";

  // Redirect to main chat after a few seconds
  onMount(() => {
    const timer = setTimeout(() => {
      goto("/");
    }, 10000); // 10 seconds for credits

    return () => clearTimeout(timer);
  });
</script>

<SvelteSeo
  title="Messages Added Successfully! | boreal.chat"
  description="Your messages have been added to your account. Start using them now."
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
      <h1 class="text-4xl font-bold tracking-tight">💰 Messages Added!</h1>
      <p class="text-muted-foreground text-xl">
        Your messages have been successfully added to your account.
      </p>
    </div>

    <!-- Features List -->
    <div class="space-y-6">
      <h2 class="text-lg font-semibold">What you can do with your messages:</h2>
      <div class="space-y-4 text-left">
        <div class="flex items-center gap-3">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
          >
            <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span><strong>Access to all AI models</strong></span>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
          >
            <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span>Unlimited syncing across all platforms</span>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
          >
            <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span>Basic chat functionality</span>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
          >
            <CheckCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <span>No censorship, complete privacy</span>
        </div>
      </div>
      <p class="text-muted-foreground text-sm">
        *Messages are used per request based on model and features
      </p>
    </div>

    <!-- Primary CTA -->
    <div class="space-y-4">
      <Button
        href="/"
        class="from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground w-full bg-gradient-to-r shadow-lg"
        size="lg"
      >
        <Coins class="mr-2 h-4 w-4" />
        Start Using Your Messages
        <ArrowRight class="ml-2 h-4 w-4" />
      </Button>

      <p class="text-muted-foreground text-sm">Redirecting automatically in a few seconds...</p>
    </div>

    <!-- Support -->
    <p class="text-muted-foreground text-sm">
      Need more messages? <a href="/settings/billing" class="text-primary hover:underline"
        >Buy more</a
      >
      | Questions?
      <a href="/settings/contact" class="text-primary hover:underline">Contact support</a>
    </p>
  </div>
</div>
