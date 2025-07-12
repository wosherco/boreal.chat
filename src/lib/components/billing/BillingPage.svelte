<script lang="ts">
  import { createMutation } from "@tanstack/svelte-query";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { orpcQuery } from "$lib/client/orpc";
  import { Button } from "../ui/button";
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
  import { Check, Loader2, Zap } from "@lucide/svelte";
  import { isSubscribed } from "$lib/common/utils/subscription";
  import { m } from '$lib/paraglide/messages.js';

  const user = useCurrentUser();

  const createCheckoutSession = createMutation(
    orpcQuery.v1.billing.createCheckoutSession.mutationOptions({
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
    }),
  );

  const isLoading = $derived($createCheckoutSession.isPending);
  const isLoggedIn = $derived($user.data?.authenticated);
  const isUserSubscribed = $derived(isSubscribed($user.data?.data ?? null));
</script>

<div class="space-y-12">
  <!-- Header -->
  <div class="text-center">
    <h2 class="text-3xl font-bold tracking-tight">{m.settings_pricingbilling()}</h2>
    <p class="text-muted-foreground text-lg">
      {m.settings_managebilling()}
    </p>
  </div>

  <!-- Pricing Cards -->
  <div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
    <!-- Free Plan -->
    <Card class="relative">
      <CardHeader>
        <CardTitle class="text-2xl text-gray-600 dark:text-gray-400">{m.billing_free()}</CardTitle>
        <CardDescription>{m.billing_perfectforgettingstarted()}</CardDescription>
        <div class="text-3xl font-bold">
          {m.billing_freeforever()}<span class="text-muted-foreground text-base font-normal">{m.billing_forever()}</span>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <ul class="space-y-3">
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>{m.billing_bringyourownkey()}</span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span><strong>{m.billing_accesstoallmodels()}</strong></span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>{m.billing_unlimitedsyncing()}</span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>{m.billing_basicchatfunctionality()}</span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>{m.billing_nocensorshipprivacy()}</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter class="mt-auto">
        {#if !$user.data?.authenticated}
          <Button href="/auth" variant="outline" class="w-full">{m.billing_getstartedfree()}</Button>
        {:else}
          <Button variant="outline" class="w-full" disabled>{m.billing_currentplan()}</Button>
        {/if}
      </CardFooter>
    </Card>

    <!-- Unlimited Plan -->
    <Card
      class="relative border-2 border-primary bg-gradient-to-b from-primary/5 to-primary/10 shadow-lg"
    >
      <div class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
        <div class="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-medium">
          Most Popular
        </div>
      </div>
      <CardHeader>
        <CardTitle class="text-2xl">{m.billing_unlimited()}</CardTitle>
        <CardDescription>{m.billing_unlimitedaccess()}</CardDescription>
        <div class="text-3xl font-bold">
          $19<span class="text-muted-foreground text-base font-normal">{m.billing_permonth()}</span>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <ul class="space-y-3">
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>{m.billing_everythinginfree()}</span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span><strong>{m.billing_unlimitedmessages()}</strong></span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>{m.billing_prioritysupport()}</span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>{m.billing_advancedfeatures()}</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter class="mt-auto">
        {#if !isLoggedIn}
          <Button
            href="/auth"
            class="from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground w-full bg-gradient-to-r shadow-lg"
          >
            <Zap class="mr-2 h-4 w-4" />
            {m.billing_getunlimited()}
          </Button>
        {:else if isUserSubscribed}
          <Button disabled class="w-full" variant="outline">
            <Check class="mr-2 h-4 w-4" />
            {m.billing_currentlyactive()}
          </Button>
        {:else}
          <Button
            class="from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground w-full bg-gradient-to-r shadow-lg"
            disabled={isLoading}
            onclick={() => $createCheckoutSession.mutate({ plan: "unlimited" })}
          >
            {#if isLoading}
              <Loader2 class="mr-2 animate-spin" />
            {:else}
              <Zap class="mr-2 h-4 w-4" />
            {/if}
            {m.billing_subscriptotounlimited()}
          </Button>
        {/if}
      </CardFooter>
    </Card>
  </div>

  <!-- FAQ or additional info section -->
  <div class="pt-8 text-center">
    <p class="text-muted-foreground text-sm">
      {m.billing_havequestions()} <a href="/settings/contact" class="text-primary hover:underline">{m.billing_contactus()}</a
      > {m.billing_helpchoosingplan()}
    </p>
  </div>
</div>
