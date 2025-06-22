<script lang="ts">
  import "../app.css";
  import { Toaster } from "$lib/components/ui/sonner";
  import { ModeWatcher } from "mode-watcher";
  import type { LayoutProps } from "./$types";
  import posthog from "posthog-js";
  import SearchCommand from "$lib/components/SearchCommand.svelte";

  let { children, data }: LayoutProps = $props();

  function onCopy(event: ClipboardEvent) {
    event.preventDefault();
    const raw = window.getSelection()?.toString();
    const trimmed = raw?.replace(/[\r\n]+$/, "");
    if (trimmed) {
      event.clipboardData?.setData("text/plain", trimmed);
    }
  }

  $effect(() => {
    // TODO: This should use useCurrentUser hook
    if (data.auth.currentUserInfo?.data) {
      posthog.identify(data.auth.currentUserInfo.data.id, {
        email: data.auth.currentUserInfo.data.email,
        name: data.auth.currentUserInfo.data.name,
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
<div class="relative h-full min-h-[100dvh] w-full">
  {@render children()}
</div>
