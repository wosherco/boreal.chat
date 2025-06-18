<script lang="ts">
  import "../app.css";
  import { Toaster } from "$lib/components/ui/sonner";
  import { ModeWatcher } from "mode-watcher";
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import posthog from "posthog-js";

  let { children, data }: { children: Snippet; data: LayoutData } = $props();

  $effect(() => {
    if (data.authenticated) {
      posthog.identify(data.user.id, {
        email: data.user.email,
        name: data.user.name,
      });
    } else {
      posthog.reset();
    }
  });
</script>

<ModeWatcher />
<Toaster />
<main class="flex h-[100dvh] w-full">
  {@render children()}
</main>
