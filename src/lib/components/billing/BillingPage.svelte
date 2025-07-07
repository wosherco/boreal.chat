<script lang="ts">
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { orpcQuery } from "$lib/client/orpc";
  import { isSubscribed } from "$lib/common/utils/subscription";
  import { createMutation } from "@tanstack/svelte-query";
  import { Button } from "../ui/button";
  import { Loader2 } from "@lucide/svelte";
  import { Check, Star, Zap, Coins, History } from "@lucide/svelte";
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
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
  import CreditPurchase from "../credits/CreditPurchase.svelte";
  import CreditDisplay from "../credits/CreditDisplay.svelte";
  import { createQuery } from "@tanstack/svelte-query";
  import { BILLING_ENABLED } from "$lib/common/constants";

  const user = useCurrentUser(null);

  const isLoggedIn = $derived($user.data?.authenticated ?? false);
  const isUserSubscribed = $derived(isSubscribed($user.data?.data ?? null, false));

  // Credit balance query
  const creditBalanceQuery = createQuery(
    orpcQuery.v1.billing.getCreditBalance.queryOptions({
      enabled: isLoggedIn && BILLING_ENABLED,
    })
  );

  // Credit transactions query
  const creditTransactionsQuery = createQuery(
    orpcQuery.v1.billing.getCreditTransactions.queryOptions({
      enabled: isLoggedIn && BILLING_ENABLED,
      input: { limit: 20 },
    })
  );

  const creditBalance = $derived($creditBalanceQuery.data?.balance);
  const creditTransactions = $derived($creditTransactionsQuery.data?.transactions || []);

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
  {#if BILLING_ENABLED && isLoggedIn && !isUserSubscribed && creditBalance}
    <!-- Credit Balance Display -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Coins class="h-5 w-5" />
          Credit Balance
        </CardTitle>
        <CardDescription>Your current credit balance and usage</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Available Credits</span>
            <span class="text-2xl font-bold">{creditBalance.credits}</span>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">Total Earned</span>
              <p class="font-medium">{creditBalance.totalCreditsEarned}</p>
            </div>
            <div>
              <span class="text-muted-foreground">Total Used</span>
              <p class="font-medium">{creditBalance.totalCreditsUsed}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  {/if}

  {#if isUserSubscribed}
    <div
      class="mb-6 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20"
    >
      <h2 class="mb-2 text-xl font-semibold text-green-800 dark:text-green-200">
        🎉 You are subscribed to the PRO plan
      </h2>
      <p class="mb-4 text-green-700 dark:text-green-300">
        Your subscription is active until:
        <strong>{new Date($user.data?.data?.subscribedUntil ?? "").toLocaleDateString()}</strong>
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

  <Tabs defaultValue={BILLING_ENABLED && !isUserSubscribed ? "credits" : "subscription"} class="w-full">
    <TabsList class="grid w-full grid-cols-2">
      <TabsTrigger value="subscription">Subscription Plans</TabsTrigger>
      <TabsTrigger value="credits">Buy Credits</TabsTrigger>
    </TabsList>

    <TabsContent value="subscription" class="space-y-6">
      <div class="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
    <!-- FREE Plan -->
    <Card class="relative {isLoggedIn && !isUserSubscribed ? 'ring-primary ring-2' : ''}">
      {#if isLoggedIn && !isUserSubscribed}
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
          <Badge variant="default" class="bg-primary text-primary-foreground">Current Plan</Badge>
        </div>
      {/if}
      <CardHeader>
        <CardTitle class="text-2xl">FREE</CardTitle>
        <CardDescription>For individuals getting started.</CardDescription>
        <div class="text-3xl font-bold">
          0€<span class="text-muted-foreground text-base font-normal">/month</span>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <ul class="space-y-3">
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>Bring your own key (BYOK). You pay for what you use.</span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>Sync of chats across unlimited platforms</span>
          </li>
          <li class="flex items-center gap-3">
            <Check class="h-5 w-5 text-green-500" />
            <span>Basic web search with all models</span>
          </li>
        </ul>
      </CardContent>
      <CardFooter class="mt-auto">
        {#if !isLoggedIn}
          <Button href="/auth" class="w-full" variant="outline">Sign Up for Free</Button>
        {:else if !isUserSubscribed}
          <Button
            disabled={isLoading}
            onclick={() => $createCustomerSession.mutate({})}
            class="w-full"
            variant="outline"
          >
            {#if $createCustomerSession.isPending}
              <Loader2 class="animate-spin" />
            {/if}
            Manage Account
          </Button>
        {:else}
          <Button disabled class="w-full" variant="outline">
            <Check class="mr-2 h-4 w-4" />
            Included in PRO
          </Button>
        {/if}
      </CardFooter>
    </Card>

    <!-- PRO Plan -->
    <Card
      class="border-primary from-primary/5 via-primary/10 to-primary/5 relative border-2 bg-gradient-to-br {isUserSubscribed
        ? 'ring-primary shadow-lg ring-2'
        : ''}"
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
          PRO
        </CardTitle>
        <CardDescription>For power users and teams.</CardDescription>
        <div class="text-3xl font-bold">
          10€<span class="text-muted-foreground text-base font-normal">/month</span>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <ul class="space-y-3">
          <li class="flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-1">
              <Check class="text-primary h-3 w-3" />
            </div>
            <span
              ><strong>Unlimited requests*</strong>
              <small class="text-muted-foreground">(fair rate limits applied)</small></span
            >
          </li>
          <li class="flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-1">
              <Check class="text-primary h-3 w-3" />
            </div>
            <span
              ><strong>Unlimited files*</strong>
              <small class="text-muted-foreground">(fair rate limits applied)</small></span
            >
          </li>
          <li class="flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-1">
              <Check class="text-primary h-3 w-3" />
            </div>
            <span><strong>Advanced web searching</strong></span>
          </li>
          <li class="flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-1">
              <Check class="text-primary h-3 w-3" />
            </div>
            <span><strong>Advanced Data Analysis</strong></span>
          </li>
          <li class="flex items-center gap-3">
            <div class="bg-primary/20 rounded-full p-1">
              <Check class="text-primary h-3 w-3" />
            </div>
            <span><strong>Projects</strong></span>
          </li>
        </ul>

        <!-- Everything from FREE plan included note -->
        <div class="border-primary/20 border-t pt-2">
          <p class="text-muted-foreground text-sm">Plus everything from the FREE plan</p>
        </div>
      </CardContent>
      <CardFooter>
        {#if !isLoggedIn}
          <Button
            href="/auth"
            class="from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground w-full bg-gradient-to-r shadow-lg"
          >
            <Zap class="mr-2 h-4 w-4" />
            Sign Up for PRO
          </Button>
        {:else if !isUserSubscribed}
          <Button
            class="from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground w-full bg-gradient-to-r shadow-lg"
            disabled={isLoading}
            onclick={() => $createCheckoutSession.mutate({})}
          >
            {#if isLoading}
              <Loader2 class="mr-2 animate-spin" />
            {:else}
              <Zap class="mr-2 h-4 w-4" />
            {/if}
            Subscribe to PRO
          </Button>
        {:else}
          <Button disabled class="w-full" variant="outline">
            <Check class="mr-2 h-4 w-4" />
            Currently Active
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
    </TabsContent>

    <TabsContent value="credits" class="space-y-6">
      {#if BILLING_ENABLED}
        {#if isLoggedIn}
          <CreditPurchase />
          
          {#if creditTransactions.length > 0}
            <!-- Transaction History -->
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <History class="h-5 w-5" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Your recent credit transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  {#each creditTransactions.slice(0, 10) as transaction}
                    <div class="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div class="flex-1">
                        <p class="text-sm font-medium">{transaction.description}</p>
                        <p class="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div class="flex items-center gap-2">
                        {#if transaction.couponCode}
                          <Badge variant="secondary" class="text-xs">
                            {transaction.couponCode}
                          </Badge>
                        {/if}
                        <span class={`text-sm font-medium ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </span>
                      </div>
                    </div>
                  {/each}
                </div>
              </CardContent>
            </Card>
          {/if}
        {:else}
          <div class="text-center py-8">
            <p class="text-muted-foreground">Please sign in to purchase credits</p>
            <Button href="/auth" class="mt-4">Sign In</Button>
          </div>
        {/if}
      {:else}
        <div class="text-center py-8">
          <p class="text-muted-foreground">Credit system is disabled</p>
        </div>
      {/if}
    </TabsContent>
  </Tabs>
</div>
