<script lang="ts">
  import { Alert } from "$lib/components/ui/alert";
  import { Button } from "$lib/components/ui/button";
  import { AlertCircleIcon, Loader2Icon } from "@lucide/svelte";
  import type { PageProps } from "./$types";
  import { orpc } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";
  import { invalidate } from "$app/navigation";
  import { page } from "$app/state";
  import SvelteSeo from "svelte-seo";
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "$lib/components/ui/card";

  const { data }: PageProps = $props();

  const openRouterAccount = $derived(data.byok.openrouter);

  let loadingMutation = $state(false);

  async function disconnectOpenRouter() {
    if (loadingMutation) return;
    loadingMutation = true;

    try {
      await orpc.v1.byok.delete();
      toast.success("OpenRouter disconnected");
      invalidate(page.url);
    } catch (error) {
      console.error(error);
      toast.error("Error disconnecting OpenRouter");
    } finally {
      loadingMutation = false;
    }
  }
</script>

<SvelteSeo title="Bring Your Own Key | boreal.chat" />

<div class="space-y-6">
  <h1 class="text-2xl font-semibold">Bring Your Own Key</h1>
  <Card>
    <CardHeader>
      <CardTitle>OpenRouter</CardTitle>
    </CardHeader>
    <CardContent>
      {#if openRouterAccount === null}
        <p class="text-muted-foreground text-sm">
          Please log in to manage your OpenRouter connection.
        </p>
      {:else}
        {#await openRouterAccount}
          <div class="text-muted-foreground flex items-center text-sm">
            <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
            Checking status...
          </div>
        {:then value}
          {#if value}
            <p class="text-muted-foreground text-sm">Your OpenRouter account is connected.</p>
          {:else}
            <p class="text-muted-foreground text-sm">
              Connect your OpenRouter account to get started.
            </p>
          {/if}
        {:catch}
          <Alert variant="destructive">
            <AlertCircleIcon class="h-4 w-4" />
            <p>Error loading your OpenRouter account</p>
          </Alert>
        {/await}
      {/if}
    </CardContent>
    <CardFooter class="justify-end">
      {#if openRouterAccount === null}
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
                onclick={disconnectOpenRouter}
                disabled={loadingMutation}
              >
                {#if loadingMutation}
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
