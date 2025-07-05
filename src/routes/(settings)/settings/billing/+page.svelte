<script lang="ts">
  import { browser, dev } from "$app/environment";
  import { BILLING_FEATURE_FLAG } from "$lib/common/featureFlags";
  import BillingPage from "$lib/components/billing/BillingPage.svelte";
  import posthog from "posthog-js";
  import { onMount } from "svelte";
  import SvelteSeo from "svelte-seo";
  import type { PageProps } from "./$types";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { ArrowRightIcon, Loader2Icon } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";

  let isBillingPageEnabled = $state(dev);

  const { data }: PageProps = $props();

  const user = useCurrentUser(data.auth.currentUserInfo);

  onMount(() => {
    if (browser && !dev) {
      isBillingPageEnabled = posthog.isFeatureEnabled(BILLING_FEATURE_FLAG) ?? false;
    }
  });
</script>

<SvelteSeo title="Pricing & Billing | boreal.chat" />

<h1 class="text-2xl font-semibold">Pricing & Billing</h1>
<h2 class="text-muted-foreground">Manage your subscription and billing details.</h2>

<div class="flex flex-col gap-2 pt-4">
  {#if $user.loading}
    <div class="flex items-center justify-center">
      <Loader2Icon class="size-4 animate-spin" />
    </div>
  {:else if !isBillingPageEnabled}
    <p>Billing page is not enabled</p>
  {:else}
    <BillingPage />
  {/if}
</div>
