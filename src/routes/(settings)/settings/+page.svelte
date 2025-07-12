<script lang="ts">
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { ArrowRightIcon, Loader2Icon } from "@lucide/svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import SvelteSeo from "svelte-seo";
  import type { PageProps } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import { m } from '$lib/paraglide/messages.js';

  const { data }: PageProps = $props();

  const user = useCurrentUser(data.auth.currentUserInfo);
</script>

<SvelteSeo title="Settings | boreal.chat" />

<h1 class="text-2xl font-semibold">{m.settings_accountoverview()}</h1>

<div class="flex flex-col gap-2 pt-4">
  {#if $user.loading}
    <div class="flex items-center justify-center">
      <Loader2Icon class="size-4 animate-spin" />
    </div>
  {:else if !$user.data?.authenticated || !$user.data?.data}
    <Button variant="link" href="/auth" class="w-fit"
      >{m.settings_pleaseloginfirst()} <ArrowRightIcon /></Button
    >
  {:else}
    <p>👋 Welcome back, {$user.data.data.name}!</p>

    <Card class="w-fit">
      <CardHeader>
        <CardTitle>{m.settings_profile()}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-row items-center gap-4">
          <!-- svelte-ignore a11y_img_redundant_alt -->
          <img
            src={$user.data.data.profilePicture}
            alt="{m.settings_profilepicture()}"
            class="size-16 rounded-full"
          />
          <div class="flex flex-col gap-1">
            <p class="font-semibold">{$user.data.data.name}</p>
            <p class="text-muted-foreground text-sm">{$user.data.data.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>
