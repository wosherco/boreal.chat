<script lang="ts">
  import type { LayoutProps } from "./$types";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { HomeIcon, Loader2Icon } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";

  const { data, children }: LayoutProps = $props();

  const currentUser = useCurrentUser(data.auth.currentUserInfo);

  $effect(() => {
    if (!$currentUser.loading && !!$currentUser.data?.authenticated) {
      goto("/");
    }
  });
</script>

<Button variant="link" href="/" class="absolute top-4 left-4 z-10">
  <HomeIcon class="size-4" />
  Back to home
</Button>

{#if $currentUser.loading}
  <div class="flex h-screen w-screen items-center justify-center">
    <div class="flex flex-col items-center justify-center">
      <Loader2Icon class="size-10 animate-spin" />
    </div>
  </div>
{:else}
  <main class="flex h-screen w-screen items-center justify-center">
    <div
      class="bg-card relative flex w-full max-w-md flex-col items-center rounded-xl p-8 shadow-lg"
    >
      {@render children()}
    </div>
  </main>
{/if}
