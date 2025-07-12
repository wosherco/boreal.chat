<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { CheckCircle, ArrowRight, InfinityIcon } from "@lucide/svelte";
  import SvelteSeo from "svelte-seo";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { m } from '$lib/paraglide/messages.js';

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
      <h1 class="text-4xl font-bold tracking-tight">{m.billing_welcometounlimited()}</h1>
      <p class="text-muted-foreground text-xl">{m.billing_subscriptionactive()}</p>
    </div>

    <!-- Features List -->
    <div class="space-y-6">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">{m.billing_enjoyunlimitedaccess()}</h3>
        <ul class="space-y-2 text-sm">
          <li class="flex items-center gap-2">
            <CheckCircle class="h-4 w-4 text-green-500" />
            <span>{m.billing_unlimitedmessages()}</span>
          </li>
          <li class="flex items-center gap-2">
            <CheckCircle class="h-4 w-4 text-green-500" />
            <span>{m.billing_prioritysupport()}</span>
          </li>
          <li class="flex items-center gap-2">
            <CheckCircle class="h-4 w-4 text-green-500" />
            <span>{m.billing_advancedfeatures()}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Action Button -->
    <div class="space-y-4">
      <Button href="/" class="w-full">
        <ArrowRight class="mr-2 h-4 w-4" />
        {m.billing_getstartedbutton()}
      </Button>
      <p class="text-muted-foreground text-sm">
        {m.billing_redirectingin({ seconds: "15" })}
      </p>
    </div>
  </div>
</div>
