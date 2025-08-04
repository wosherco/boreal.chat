<script lang="ts">
  import { createCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { ArrowRightIcon, Loader2Icon } from "@lucide/svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import SvelteSeo from "svelte-seo";
  import type { PageProps } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import EmailVerificationAlert from "$lib/components/alerts/EmailVerificationAlert.svelte";
  import SettingsLayout from "$lib/components/settings/SettingsLayout.svelte";

  const { data }: PageProps = $props();

  const user = createCurrentUser(() => data.auth.currentUserInfo);
</script>

<SettingsLayout title="Account Overview" description="Manage your boreal.chat account">
  <div class="flex flex-col gap-2 pt-4">
    {#if user.loading}
      <div class="flex items-center justify-center">
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    {:else if !user.data?.authenticated || !user.data?.data}
      <Button variant="link" href="/auth" class="w-fit"
        >Please, log in first <ArrowRightIcon /></Button
      >
    {:else}
      <p>👋 Welcome back, {user.data.data.name}!</p>
    {/if}
  </div>
</SettingsLayout>
