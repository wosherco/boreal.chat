<script lang="ts">
  import { browser } from "$app/environment";
  import posthog from "posthog-js";
  import { onMount } from "svelte";
  import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
  import { Button } from "./ui/button";
  import { hasAskedTrackingConsent, setHasAskedTrackingConsent } from "$lib/utils/localStorage";
  import { slide } from "svelte/transition";
  import { m } from '$lib/paraglide/messages.js';

  let showPrompt = $state(false);

  onMount(() => {
    if (!browser) {
      return;
    }

    if (!hasAskedTrackingConsent()) {
      setTimeout(() => {
        showPrompt = true;
      }, 1000);
    }
  });

  function accept() {
    posthog.opt_in_capturing();
    showPrompt = false;
    setHasAskedTrackingConsent(true);
  }

  function reject() {
    posthog.opt_out_capturing();
    showPrompt = false;
    setHasAskedTrackingConsent(true);
  }
</script>

{#if showPrompt}
  <div class="fixed right-0 bottom-0 z-50 m-4 w-full max-w-[400px]" transition:slide>
    <Card>
      <CardHeader>
        <CardTitle>{m.tracking_trackingconsent()}</CardTitle>
        <CardDescription>
          {m.tracking_weusecookies()}
          <a href="/privacy-policy" class="text-blue-500">{m.tracking_privacypolicy()}</a>.
        </CardDescription>
      </CardHeader>
      <CardFooter class="flex w-full gap-2">
        <Button onclick={accept} class="flex-1">{m.tracking_accept()}</Button>
        <Button onclick={reject} class="flex-1" variant="outline">{m.tracking_reject()}</Button>
      </CardFooter>
    </Card>
  </div>
{/if}
