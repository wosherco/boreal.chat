<script lang="ts">
  import type { LayoutProps } from "./$types";
  import { HomeIcon } from "@lucide/svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  const { children }: LayoutProps = $props();
</script>

<Button variant="link" href="/" class="absolute top-4 left-4 z-10">
  <HomeIcon class="size-4" />
  Back to home
</Button>

<main class="flex h-screen w-screen items-center justify-center">
  <div class="bg-card relative flex w-full max-w-md flex-col items-center rounded-xl p-8 shadow-lg">
    {@render children()}
  </div>
</main>
