<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Loader2Icon } from "@lucide/svelte";
  import type { PageProps } from "./$types";
  import { orpcQuery } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";
  import { invalidate } from "$app/navigation";
  import { page } from "$app/state";
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { createCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { createBYOKs } from "$lib/client/hooks/useBYOKs.svelte";
  import { createMutation } from "@tanstack/svelte-query";
  import SettingsLayout from "$lib/components/settings/SettingsLayout.svelte";

  const { data }: PageProps = $props();

  const user = createCurrentUser(() => data.auth.currentUserInfo);
  const byoks = createBYOKs(() => data.byok.byoks ?? null);
  const openRouterAccount = $derived(byoks.data?.find((byok) => byok.platform === "openrouter"));

  const deleteByokAccountMutation = createMutation(
    orpcQuery.v1.byok.delete.mutationOptions({
      onSuccess: () => {
        toast.success("OpenRouter disconnected");
        invalidate(page.url);
      },
      onError: (error) => {
        console.error(error);
        toast.error("Error disconnecting OpenRouter");
      },
    }),
  );
</script>

<SettingsLayout title="Keys Settings" description="Manage your own API keys in boreal.chat">
  <div class="space-y-6 pt-4">
    <Card>
      <CardHeader>
        <CardTitle>OpenRouter</CardTitle>
      </CardHeader>
      <CardContent>
        {#if !user.data?.authenticated}
          <p class="text-muted-foreground text-sm">
            Please log in to manage your OpenRouter connection.
          </p>
        {:else if byoks.loading || !byoks.data}
          <div class="text-muted-foreground flex items-center text-sm">
            <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
            Checking status...
          </div>
        {:else if openRouterAccount}
          <p class="text-muted-foreground text-sm">Your OpenRouter account is connected.</p>
        {:else}
          <p class="text-muted-foreground text-sm">
            Connect your OpenRouter account to get started.
          </p>
        {/if}
      </CardContent>
      <CardFooter class="justify-end">
        {#if !user.data?.authenticated}
          <Button href="/auth">Log In</Button>
        {:else}
          {#await openRouterAccount}
            <div class="bg-muted h-10 w-24 animate-pulse rounded-md"></div>
          {:then value}
            {#if value}
              <div class="flex gap-2">
                <Button href="/settings/byok/openrouter" variant="outline">Reconnect</Button>
                <Button
                  variant="destructive"
                  onclick={() => $deleteByokAccountMutation.mutate({ platform: "openrouter" })}
                  disabled={$deleteByokAccountMutation.isPending}
                >
                  {#if $deleteByokAccountMutation.isPending}
                    <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
                  {/if}
                  Disconnect
                </Button>
              </div>
            {:else}
              <Button href="/settings/byok/openrouter">Connect OpenRouter</Button>
            {/if}
          {:catch}
            <!-- Error is displayed in content -->
          {/await}
        {/if}
      </CardFooter>
    </Card>
  </div>
</SettingsLayout>
