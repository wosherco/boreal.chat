<script lang="ts">
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { ArrowRightIcon, Loader2Icon } from "@lucide/svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import SvelteSeo from "svelte-seo";
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button";

  const { data }: { data: PageData } = $props();

  const user = useCurrentUser(data);
</script>

<SvelteSeo title="Settings | boreal.chat" />

<h1 class="text-xl font-semibold">Account Overview</h1>

<div class="flex flex-col gap-2 pt-4">
  {#if $user.loading}
    <div class="flex items-center justify-center">
      <Loader2Icon class="size-4 animate-spin" />
    </div>
  {:else if $user.data === null || !$user.data.authenticated}
    <Button variant="link" href="/auth" class="w-fit"
      >Please, log in first <ArrowRightIcon /></Button
    >
  {:else}
    <p>👋 Welcome back, {$user.data.user.name}!</p>

    <Card class="w-fit">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-row items-center gap-4">
          <!-- svelte-ignore a11y_img_redundant_alt -->
          <img
            src={$user.data.user.profilePicture}
            alt="Profile Picture"
            class="size-16 rounded-full"
          />
          <div class="flex flex-col gap-1">
            <p class="font-semibold">{$user.data.user.name}</p>
            <p class="text-muted-foreground text-sm">{$user.data.user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
