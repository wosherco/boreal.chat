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
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { m } from '$lib/paraglide/messages.js';

  const { data }: PageProps = $props();

  const user = useCurrentUser(data.auth.currentUserInfo);
  const openRouterAccount = $derived(data.byok.openrouter);

  let loadingMutation = $state(false);

  async function disconnectOpenRouter() {
    if (loadingMutation) return;
    loadingMutation = true;

    try {
      await orpc.v1.byok.delete();
      toast.success(m.billing_openrouterdisconnected());
      invalidate(page.url);
    } catch (error) {
      console.error(error);
      toast.error(m.error_disconnectingopenrouter());
    } finally {
      loadingMutation = false;
    }
  }
</script>

<SvelteSeo title="Bring Your Own Key | boreal.chat" />

<h1 class="text-2xl font-semibold">{m.settings_bringyourownkey()}</h1>
<h2 class="text-muted-foreground">
  {m.settings_connectyourapikey()}
</h2>

<div class="space-y-6 pt-4">
  {#if $user.loading}
    <div class="flex items-center justify-center">
      <Loader2Icon class="size-4 animate-spin" />
    </div>
  {:else if !$user.data?.authenticated || !$user.data?.data}
    <p>{m.settings_pleaseloginfirst()}</p>
  {:else}
    <Card>
      <CardHeader>
        <CardTitle>OpenRouter</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">
          {m.billing_openrouterdescription()}
        </p>
        <div class="mt-4">
          <p class="text-sm font-medium">
            {m.general_status()}: {openRouterAccount ? m.billing_connected() : m.billing_notconnected()}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        {#if openRouterAccount}
          <Button 
            variant="destructive" 
            onclick={disconnectOpenRouter}
            disabled={loadingMutation}
          >
            {#if loadingMutation}
              <Loader2Icon class="mr-2 size-4 animate-spin" />
            {/if}
            {m.billing_disconnectopenrouter()}
          </Button>
        {:else}
          <Button href="/settings/byok/openrouter">
            {m.billing_connectopenrouter()}
          </Button>
        {/if}
      </CardFooter>
    </Card>
  {/if}
</div>
