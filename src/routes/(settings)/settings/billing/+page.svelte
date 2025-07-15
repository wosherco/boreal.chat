<script lang="ts">
  import { dev } from "$app/environment";
  import { BILLING_FEATURE_FLAG, getFeatureFlag } from "$lib/common/featureFlags";
  import BillingPage from "$lib/components/billing/BillingPage.svelte";
  import SvelteSeo from "svelte-seo";
  import type { PageProps } from "./$types";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { Loader2Icon } from "@lucide/svelte";

  let isBillingPageEnabled = $derived(dev || getFeatureFlag(BILLING_FEATURE_FLAG).enabled);

  const { data }: PageProps = $props();

  const user = useCurrentUser(data.auth.currentUserInfo);
</script>

<SvelteSeo title="Credits & Billing | boreal.chat" />

<h1 class="text-2xl font-semibold">Credits & Billing</h1>
<h2 class="text-muted-foreground">Manage your credits and payment methods.</h2>

<div class="flex flex-col gap-2 pt-4">
  {#if $user.loading}
    <div class="flex items-center justify-center">
      <Loader2Icon class="size-4 animate-spin" />
    </div>
  {:else if !isBillingPageEnabled}
    <p>Credits page is not enabled</p>
  {:else}
    <BillingPage />
  {/if}
</div>
