<script lang="ts">
  import { Coins, Star, Ticket } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Badge } from "$lib/components/ui/badge";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card";
  import { orpcQuery } from "$lib/client/orpc";
  import { createMutation, createQuery } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import { Loader2 } from "@lucide/svelte";

  interface Props {
    onSuccess?: () => void;
  }

  let { onSuccess }: Props = $props();

  let couponCode = $state("");

  // Fetch credit packages
  const creditPackagesQuery = createQuery(
    orpcQuery.v1.billing.getCreditPackages.queryOptions()
  );

  // Create credit checkout session
  const createCreditCheckout = createMutation(
    orpcQuery.v1.billing.createCreditCheckoutSession.mutationOptions({
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

  function buyCredits(packageId: string) {
    $createCreditCheckout.mutate({
      packageId,
      couponCode: couponCode.trim() || undefined,
    });
  }

  const isLoading = $derived($createCreditCheckout.isPending);
  const packages = $derived($creditPackagesQuery.data?.packages || []);
</script>

<div class="space-y-6">
  <div class="text-center">
    <h2 class="text-2xl font-bold">Buy Credits</h2>
    <p class="text-muted-foreground">Choose a credit package to continue using the platform</p>
  </div>

  <!-- Coupon Code Input -->
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-lg">
        <Ticket class="h-5 w-5" />
        Coupon Code
      </CardTitle>
      <CardDescription>
        Have a coupon code? Enter it below to get a discount on your purchase.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex gap-2">
        <div class="flex-1">
          <Label for="coupon" class="sr-only">Coupon Code</Label>
          <Input
            id="coupon"
            placeholder="Enter coupon code"
            bind:value={couponCode}
            disabled={isLoading}
          />
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Credit Packages -->
  {#if $creditPackagesQuery.isPending}
    <div class="flex justify-center py-8">
      <Loader2 class="h-8 w-8 animate-spin" />
    </div>
  {:else if $creditPackagesQuery.isError}
    <div class="text-center py-8">
      <p class="text-red-600">Failed to load credit packages</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each packages as pkg}
        <Card class={`relative ${pkg.popular ? 'ring-primary ring-2' : ''}`}>
          {#if pkg.popular}
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 transform">
              <Badge class="bg-primary text-primary-foreground">
                <Star class="mr-1 h-3 w-3" />
                Popular
              </Badge>
            </div>
          {/if}

          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Coins class="h-5 w-5" />
              {pkg.credits} Credits
            </CardTitle>
            <CardDescription>
              €{pkg.priceEuros.toFixed(2)}
              {#if pkg.discount > 0}
                <Badge variant="secondary" class="ml-2 text-xs">
                  {pkg.discount}% off
                </Badge>
              {/if}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div class="space-y-2">
              <p class="text-sm text-muted-foreground">
                ~{pkg.credits} messages
              </p>
              <p class="text-xs text-muted-foreground">
                €{(pkg.priceEuros / pkg.credits * 100).toFixed(3)} per 100 credits
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              class="w-full"
              variant={pkg.popular ? "default" : "outline"}
              disabled={isLoading}
              onclick={() => buyCredits(pkg.id)}
            >
              {#if isLoading}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {/if}
              Buy Now
            </Button>
          </CardFooter>
        </Card>
      {/each}
    </div>
  {/if}

  <div class="text-center text-sm text-muted-foreground">
    <p>• Credits never expire</p>
    <p>• Use credits for AI messages and features</p>
    <p>• Secure payment processed by Stripe</p>
  </div>
</div>