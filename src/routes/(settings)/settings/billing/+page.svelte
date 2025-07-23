<script lang="ts">
  import BillingPage from "$lib/components/billing/BillingPage.svelte";
  import SvelteSeo from "svelte-seo";
  import type { PageProps } from "./$types";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { Loader2Icon } from "@lucide/svelte";

  const { data }: PageProps = $props();

  const user = useCurrentUser(data.auth.currentUserInfo);
</script>

<SvelteSeo title="Pricing & Billing | boreal.chat" />

<h1 class="text-2xl font-semibold">Pricing & Billing</h1>
<h2 class="text-muted-foreground">Manage your subscription and billing details.</h2>

<div class="flex flex-col gap-2 pt-4">
  {#if $user.loading}
    <div class="flex items-center justify-center">
      <Loader2Icon class="size-4 animate-spin" />
    </div>
  {:else}
    <BillingPage />
  {/if}
</div>
