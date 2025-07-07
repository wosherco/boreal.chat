<script lang="ts">
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { ArrowRightIcon, Loader2Icon } from "@lucide/svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import SvelteSeo from "svelte-seo";
  import type { PageProps } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import AddCreditsDialog from "$lib/components/billing/AddCreditsDialog.svelte";

  const { data }: PageProps = $props();

  const user = useCurrentUser(data.auth.currentUserInfo);

  let addCreditsDialogOpen = $state(false);
</script>

<AddCreditsDialog
  bind:open={addCreditsDialogOpen}
  onOpenChange={(open) => (addCreditsDialogOpen = open)}
/>

<SvelteSeo title="Settings | boreal.chat" />

<h1 class="text-2xl font-semibold">Account Overview</h1>

<div class="flex flex-col gap-2 pt-4">
  {#if $user.loading}
    <div class="flex items-center justify-center">
      <Loader2Icon class="size-4 animate-spin" />
    </div>
  {:else if !$user.data?.authenticated || !$user.data?.data}
    <Button variant="link" href="/auth" class="w-fit"
      >Please, log in first <ArrowRightIcon /></Button
    >
  {:else}
    <p>👋 Welcome back, {$user.data.data.name}!</p>

    <Card class="w-fit">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-row items-center gap-4">
          <!-- svelte-ignore a11y_img_redundant_alt -->
          <img
            src={$user.data.data.profilePicture}
            alt="Profile Picture"
            class="size-16 rounded-full"
          />
          <div class="flex flex-col gap-1">
            <p class="font-semibold">{$user.data.data.name}</p>
            <p class="text-muted-foreground text-sm">{$user.data.data.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="w-fit">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">Messages</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <span class="font-mono text-2xl font-bold">{Math.round($user.data.data.credits)}</span>
            <span class="text-muted-foreground text-sm">messages available</span>
          </div>
          <Button
            onclick={() => (addCreditsDialogOpen = true)}
            variant="outline"
            size="sm"
            class="w-fit"
          >
            Add Credits
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
