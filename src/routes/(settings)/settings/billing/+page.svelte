<script lang="ts">
  import BillingPage from "$lib/components/billing/BillingPage.svelte";
  import SvelteSeo from "svelte-seo";
  import type { PageProps } from "./$types";
  import { createCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { Loader2Icon } from "@lucide/svelte";
  import SettingsLayout from "$lib/components/settings/SettingsLayout.svelte";

  const { data }: PageProps = $props();

  const user = createCurrentUser(() => data.auth.currentUserInfo);
</script>

<SettingsLayout
  title="Pricing & Billing"
  description="Manage your subscription and billing details."
>
  <div class="flex flex-col gap-2 pt-4">
    {#if user.loading}
      <div class="flex items-center justify-center">
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    {:else}
      <BillingPage />
    {/if}
  </div>
</SettingsLayout>
