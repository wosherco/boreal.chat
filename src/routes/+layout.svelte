<script lang="ts">
  import "../app.css";
  import "../scrollbar.css";
  import { Toaster } from "$lib/components/ui/sonner";
  import { ModeWatcher } from "mode-watcher";
  import type { LayoutProps } from "./$types";
  import posthog from "posthog-js";
  import SearchCommand from "$lib/components/SearchCommand.svelte";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";

  let { children, data }: LayoutProps = $props();

  function onCopy(event: ClipboardEvent) {
    event.preventDefault();
    const raw = window.getSelection()?.toString();
    const trimmed = raw?.replace(/[\r\n]+$/, "");
    if (trimmed) {
      event.clipboardData?.setData("text/plain", trimmed);
    }
  }

  const currentUser = useCurrentUser(data.auth.currentUserInfo);

  $effect(() => {
    if ($currentUser.loading || !$currentUser.data) {
      return;
    }

    if ($currentUser.data.authenticated && $currentUser.data.data) {
      posthog.identify($currentUser.data.data.id, {
        email: $currentUser.data.data.email,
        name: $currentUser.data.data.name,
      });
    } else {
      posthog.reset();
    }
  });
</script>

<svelte:window on:copy={onCopy} />

<ModeWatcher />
<Toaster />
<SearchCommand />
<div class="min-h-pwa relative w-full">
  {@render children()}
</div>
