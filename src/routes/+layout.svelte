<script lang="ts">
  import "../app.css";
  import "../scrollbar.css";
  import { Toaster } from "$lib/components/ui/sonner";
  import { ModeWatcher } from "mode-watcher";
  import type { LayoutProps } from "./$types";
  import posthog from "posthog-js";
  import SearchCommand from "$lib/components/SearchCommand.svelte";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
  import { browser, dev } from "$app/environment";
  import { SvelteQueryDevtools } from "@tanstack/svelte-query-devtools";
  import { onNavigate } from "$app/navigation";
  import TrackingConsentPrompt from "$lib/components/TrackingConsentPrompt.svelte";

  let { children, data }: LayoutProps = $props();

  function onCopy(event: ClipboardEvent) {
    event.preventDefault();
    const raw = window.getSelection()?.toString();
    const trimmed = raw?.replace(/[\r\n]+$/, "");
    if (trimmed) {
      event.clipboardData?.setData("text/plain", trimmed);
    }
  }

  onNavigate((navigation) => {
    if (!browser || !document.startViewTransition) {
      return;
    }

    const fromPath = navigation.from?.url?.pathname;
    const toPath = navigation.to?.url?.pathname;

    if (fromPath && toPath) {
      const fromSettings = fromPath.startsWith("/settings");
      const toSettings = toPath.startsWith("/settings");

      if (fromSettings && toSettings) {
        return;
      }
    }

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

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

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  });
</script>

<svelte:window on:copy={onCopy} />

<QueryClientProvider client={queryClient}>
  <TrackingConsentPrompt />
  <ModeWatcher />
  <Toaster />
  <SearchCommand />
  <div class="min-h-pwa relative w-full">
    {@render children()}
  </div>

  {#if dev}
    <SvelteQueryDevtools />
  {/if}
</QueryClientProvider>
