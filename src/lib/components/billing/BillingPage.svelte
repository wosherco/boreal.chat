<script lang="ts">
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { orpcQuery } from "$lib/client/orpc";
  import { isSubscribed } from "$lib/common/utils/subscription";
  import { createMutation } from "@tanstack/svelte-query";
  import { Button } from "../ui/button";
  import { Loader2 } from "@lucide/svelte";
  import { Star } from "@lucide/svelte";
  import { toast } from "svelte-sonner";
  import PricingPlan from "$lib/components/PricingPlan.svelte";
  import { pricingPlans } from "$lib/common/pricing";
  import type { PricingPlan as PricingPlanType } from "$lib/common/pricing";

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

  function getButtonConfig(
    plan: PricingPlanType,
    isLoggedIn: boolean,
    isUserSubscribed: boolean,
    isLoading: boolean,
  ) {
    const isFree = plan.id === "free";
    const isUnlimited = plan.id === "unlimited";

    let text: string;
    if (isFree) {
      text = !isLoggedIn ? "Get Started Free" : "Current plan";
    } else {
      text = !isLoggedIn
        ? "Get Unlimited"
        : isUserSubscribed
          ? "Currently Active"
          : isLoading
            ? "Processing..."
            : "Subscribe to Unlimited";
    }

    const variant =
      (isFree && isLoggedIn) || (isUnlimited && isUserSubscribed)
        ? "outline"
        : isUnlimited
          ? "default"
          : plan.buttonVariant;

    return { text, variant };
  }
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
    {#each pricingPlans as plan (plan.id)}
      {@const isFree = plan.id === "free"}
      {@const isUnlimited = plan.id === "unlimited"}
      {@const isDisabled = (isFree && isLoggedIn) || (isUnlimited && isUserSubscribed) || isLoading}
      {@const buttonConfig = getButtonConfig(plan, isLoggedIn, isUserSubscribed, isLoading)}

      <PricingPlan
        title={plan.title}
        description={plan.description}
        price={plan.price}
        priceSubtext={plan.priceSubtext}
        features={plan.features}
        buttonText={buttonConfig.text}
        buttonVariant={buttonConfig.variant}
        buttonAction={() => {
          if (isDisabled) return;

          if (isFree && !isLoggedIn) {
            window.location.href = "/auth";
          } else if (isUnlimited && !isLoggedIn) {
            window.location.href = "/auth";
          } else if (isUnlimited && isLoggedIn && !isUserSubscribed) {
            $createCheckoutSession.mutate({ plan: "unlimited" });
          }
        }}
        isPopular={isUnlimited && !isUserSubscribed ? plan.isPopular : false}
        isPrimary={plan.isPrimary}
        customBadgeText={isUnlimited && isUserSubscribed ? "Current Plan" : null}
        customBadgeIcon={isUnlimited && isUserSubscribed ? Star : undefined}
        isButtonDisabled={isDisabled}
      />
    {/each}
  </div>

  <!-- FAQ or additional info section -->
  <div class="pt-8 text-center">
    <p class="text-muted-foreground text-sm">
      Have questions? <a href="/settings/contact" class="text-primary hover:underline">Contact us</a
      > for help choosing the right plan.
    </p>
  </div>
</div>
