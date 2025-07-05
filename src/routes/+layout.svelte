<script lang="ts">
  import "../app.css";
  import "../scrollbar.css";
  import { Toaster } from "$lib/components/ui/sonner";
  import { ModeWatcher } from "mode-watcher";
  import type { LayoutProps } from "./$types";
  import posthog from "posthog-js";
  import SearchCommand from "$lib/components/SearchCommand.svelte";
  import CookieConsent from "$lib/components/CookieConsent.svelte";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
  import { browser, dev } from "$app/environment";
  import { SvelteQueryDevtools } from "@tanstack/svelte-query-devtools";
  import { createCookieConsentState } from "$lib/utils/localStorage";
  import { env } from "$env/dynamic/public";

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
  const cookieConsent = createCookieConsentState();

  // Reactive PostHog initialization based on consent
  $effect(() => {
    if (!browser) return;

    if (cookieConsent.consent === "accepted" && env.PUBLIC_POSTHOG_API_KEY && env.PUBLIC_POSTHOG_HOST) {
      // Initialize PostHog if not already initialized
      if (!posthog.__loaded) {
        posthog.init(env.PUBLIC_POSTHOG_API_KEY, {
          api_host: env.PUBLIC_POSTHOG_HOST,
          person_profiles: "identified_only",
        });
      }
    } else if (cookieConsent.consent === "declined") {
      // Shut down PostHog if declined
      if (posthog.__loaded) {
        posthog.reset();
      }
    }
  });

  $effect(() => {
    if ($currentUser.loading || !$currentUser.data) {
      return;
    }

    // Only identify user if PostHog is loaded and consent is given
    if (posthog.__loaded && cookieConsent.consent === "accepted") {
      if ($currentUser.data.authenticated && $currentUser.data.data) {
        posthog.identify($currentUser.data.data.id, {
          email: $currentUser.data.data.email,
          name: $currentUser.data.data.name,
        });
      } else {
        posthog.reset();
      }
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
  <ModeWatcher />
  <Toaster />
  <SearchCommand />
  <CookieConsent />
  <div class="min-h-pwa relative w-full">
    {@render children()}
  </div>

  {#if dev}
    <SvelteQueryDevtools />
  {/if}
</QueryClientProvider>
