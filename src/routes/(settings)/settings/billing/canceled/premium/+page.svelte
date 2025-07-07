<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { XCircle, ArrowLeft, Zap } from "@lucide/svelte";
  import SvelteSeo from "svelte-seo";
</script>

<SvelteSeo
  title="Premium Checkout Canceled | boreal.chat"
  description="Your Premium checkout was canceled. You can try again anytime or continue with the free plan."
/>

<div class="flex min-h-screen items-center justify-center p-4">
  <div class="w-full max-w-md space-y-12 text-center">
    <!-- Canceled Icon -->
    <div
      class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20"
    >
      <XCircle class="h-16 w-16 text-orange-600 dark:text-orange-400" />
    </div>

    <!-- Header -->
    <div class="space-y-4">
      <h1 class="text-4xl font-bold tracking-tight">Premium Checkout Canceled</h1>
      <p class="text-muted-foreground text-xl">
        No payment was processed. You can try again anytime.
      </p>
    </div>

    <!-- Options -->
    <div class="space-y-6">
      <!-- Continue with Free -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">Continue with FREE</h2>
        <p class="text-muted-foreground">
          Use boreal.chat with your own API keys and pay only for what you use.
        </p>
        <Button href="/" variant="outline" class="w-full" size="lg">
          <ArrowLeft class="mr-2 h-4 w-4" />
          Continue with Free Plan
        </Button>
      </div>

      <!-- Divider -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <span class="border-muted w-full border-t" />
        </div>
        <div class="relative flex justify-center text-xs uppercase">
          <span class="bg-background text-muted-foreground px-2">Or</span>
        </div>
      </div>

      <!-- Try Premium Again -->
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">Try Premium again</h2>
        <p class="text-muted-foreground">
          Unlock premium AI models, higher limits, and priority support.
        </p>
        <Button
          href="/settings/billing"
          class="from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground w-full bg-gradient-to-r shadow-lg"
          size="lg"
        >
          <Zap class="mr-2 h-4 w-4" />
          View Premium Plan
        </Button>
      </div>
    </div>

    <!-- Support -->
    <p class="text-muted-foreground text-sm">
      Need help? <a href="/settings/contact" class="text-primary hover:underline">Contact support</a
      >
    </p>
  </div>
</div>
