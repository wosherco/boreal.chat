<script lang="ts">
  import "../app.css";
  import { Toaster } from "$lib/components/ui/sonner";
  import { ModeWatcher } from "mode-watcher";
  import type { Snippet } from "svelte";
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
    if (data.auth.currentUserInfo) {
      posthog.identify(data.auth.currentUserInfo.id, {
        email: data.auth.currentUserInfo.email,
        name: data.auth.currentUserInfo.name,
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
<main class="flex h-[100dvh] w-full">
  {@render children()}
</main>
