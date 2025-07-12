<script lang="ts">
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { orpcQuery } from "$lib/client/orpc";
  import { isSubscribed } from "$lib/common/utils/subscription";
  import { createMutation } from "@tanstack/svelte-query";
  import { Button } from "../ui/button";
  import { Loader2 } from "@lucide/svelte";
  import { Check, Star, Zap } from "@lucide/svelte";
  import { toast } from "svelte-sonner";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { cn } from "$lib/utils";

  const user = useCurrentUser(null);

  // Clear subscription state derivations
  const isLoggedIn = $derived($user.data?.authenticated ?? false);
  const userData = $derived($user.data?.data ?? null);
  const isUserSubscribed = $derived(isSubscribed(userData));

  const createCheckoutSession = createMutation(
    orpcQuery.v1.billing.createCheckoutSession.mutationOptions({
      onSuccess: (res) => {
        if (!res.success || !res.url) {
          toast.error("Failed to create checkout session");
          return;
        }

        window.location.href = res.url;
      },
      onError: (err) => {
        toast.error("Failed to create checkout session");
        console.error(err);
      },
    }),
  );
  const createCustomerSession = createMutation(
    orpcQuery.v1.billing.createCustomerSession.mutationOptions({
      onSuccess: (res) => {
        if (!res.success || !res.url) {
          toast.error("Failed to create customer session");
          return;
        }

        window.location.href = res.url;
      },
      onError: (err) => {
        toast.error("Failed to create customer session");
        console.error(err);
      },
    }),
  );

  const isLoading = $derived($createCheckoutSession.isPending || $createCustomerSession.isPending);
</script>

<div class="space-y-6">
  {#if isUserSubscribed}
    <div
      class="mb-6 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20"
    >
      <h2 class="mb-2 text-xl font-semibold text-green-800 dark:text-green-200">
        🎉 You are subscribed to the <strong>Unlimited</strong> plan
      </h2>
      <p class="mb-4 text-green-700 dark:text-green-300">
        Your subscription is active until:
        <strong>{new Date(userData?.subscribedUntil ?? "").toLocaleDateString()}</strong>
      </p>
      <div class="flex gap-2">
        <Button disabled={isLoading} onclick={() => $createCustomerSession.mutate({})}>
          {#if $createCustomerSession.isPending}
            <Loader2 class="animate-spin" />
          {/if}
          Manage Subscription
        </Button>
        <Button
          disabled={isLoading}
          onclick={() => $createCustomerSession.mutate({ toCancel: true })}
          variant="destructive"
        >
          {#if $createCustomerSession.isPending}
            <Loader2 class="animate-spin" />
          {/if}
          Cancel Subscription
        </Button>
      </div>
    </div>
  {/if}

  <div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2">
    <!-- Free Plan -->
    <Card class="relative">
      <CardHeader>
        <CardTitle class="text-2xl text-gray-600 dark:text-gray-400">Free</CardTitle>
        <CardDescription>Perfect for getting started with boreal.chat</CardDescription>
        <div class="text-3xl font-bold">
          Free<span class="text-muted-foreground text-base font-normal">/forever</span>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <ul class="space-y-3">
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>Bring your own key (BYOK) option</span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span><strong>Access to all AI models</strong></span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>Unlimited syncing across all platforms</span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>Basic chat functionality</span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>No censorship, complete privacy</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter class="mt-auto">
        {#if !$user.data?.authenticated}
          <Button href="/auth" variant="outline" class="w-full">Get Started Free</Button>
        {:else}
          <Button variant="outline" class="w-full" disabled>Current plan</Button>
        {/if}
      </CardFooter>
    </Card>

    <!-- Unlimited Plan -->
    <Card
      class={cn(
        "border-primary from-primary/5 via-primary/10 to-primary/5 relative border-2 bg-gradient-to-br",
        isUserSubscribed ? "ring-primary shadow-lg ring-2" : "",
      )}
    >
      {#if isUserSubscribed}
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
          <Badge class="bg-primary text-primary-foreground">
            <Star class="mr-1 h-3 w-3" />
            Current Plan
          </Badge>
        </div>
      {:else}
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
          <Badge class="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <Zap class="mr-1 h-3 w-3" />
            Most Popular
          </Badge>
        </div>
      {/if}
      <CardHeader>
        <CardTitle
          class="from-primary to-primary/80 bg-gradient-to-r bg-clip-text text-2xl text-transparent"
        >
          Unlimited
        </CardTitle>
        <CardDescription>For power users and teams who need everything.</CardDescription>
        <div class="text-3xl font-bold">
          12€<span class="text-muted-foreground text-base font-normal">/month</span>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <ul class="space-y-3">
          <li class="flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-1">
              <Check class="text-primary h-3 w-3" />
            </div>
            <span><strong>Everything in the Premium plan, plus:</strong></span>
          </li>
          <li class="flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-1">
              <Check class="text-primary h-3 w-3" />
            </div>
            <span
              ><strong>Unlimited Messages</strong>
              <small class="text-muted-foreground">(fair rate limits applied)</small></span
            >
          </li>
          <li class="flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-1">
              <Check class="text-primary h-3 w-3" />
            </div>
            <span
              ><strong>Unlimited storage</strong>
              <small class="text-muted-foreground">(fair rate limits applied)</small></span
            >
          </li>
        </ul>

        <!-- Everything from Premium plan included note -->
        <div class="border-primary/20 border-t pt-2">
          <p class="text-muted-foreground text-sm">Plus everything from the Premium plan</p>
        </div>
      </CardContent>
      <CardFooter class="mt-auto">
        {#if !isLoggedIn}
          <Button
            href="/auth"
            class="from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground w-full bg-gradient-to-r shadow-lg"
          >
            <Zap class="mr-2 h-4 w-4" />
            Get Unlimited
          </Button>
        {:else if isUserSubscribed}
          <Button disabled class="w-full" variant="outline">
            <Check class="mr-2 h-4 w-4" />
            Currently Active
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
            Subscribe to Unlimited
          </Button>
        {/if}
      </CardFooter>
    </Card>
  </div>

  <!-- FAQ or additional info section -->
  <div class="pt-8 text-center">
    <p class="text-muted-foreground text-sm">
      Have questions? <a href="/settings/contact" class="text-primary hover:underline">Contact us</a
      > for help choosing the right plan.
    </p>
  </div>
</div>
