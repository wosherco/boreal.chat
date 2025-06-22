<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import { ArrowLeftIcon } from "@lucide/svelte";
  import type { LayoutProps } from "./$types";

  const { children }: LayoutProps = $props();
</script>

<div class="mx-auto w-full max-w-screen-lg space-y-4 p-4">
  <nav class="flex gap-2 border-b pb-2">
    <Button variant="link" href="/">
      <ArrowLeftIcon class="size-4" />
      Back to home
    </Button>
    <Button variant={page.url.pathname === "/settings" ? "default" : "ghost"} href="/settings">
      Overview
    </Button>
    <Button
      variant={page.url.pathname.startsWith("/settings/byok") ? "default" : "ghost"}
      href="/settings/byok"
    >
      BYOK
    </Button>
    <Button
      variant={page.url.pathname.startsWith("/settings/customization") ? "default" : "ghost"}
      href="/settings/customization"
    >
      Customization
    </Button>
    <Button
      variant={page.url.pathname.startsWith("/settings/contact") ? "default" : "ghost"}
      href="/settings/contact"
    >
      Contact Us
    </Button>
  </nav>
  <main>
    {@render children()}
  </main>
</div>
