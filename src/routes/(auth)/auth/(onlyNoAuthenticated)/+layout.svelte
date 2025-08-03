<script lang="ts">
  import { createCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { Loader2Icon } from "@lucide/svelte";
  import type { LayoutProps } from "./$types";
  import { goto } from "$app/navigation";

  const { data, children }: LayoutProps = $props();

  const currentUser = createCurrentUser(() => data.auth.currentUserInfo);

  $effect(() => {
    if (!currentUser.loading && !!currentUser.data?.authenticated) {
      goto("/");
    }
  });
</script>

{#if currentUser.loading}
  <div class="flex h-screen w-screen items-center justify-center">
    <div class="flex flex-col items-center justify-center">
      <Loader2Icon class="size-10 animate-spin" />
    </div>
  </div>
{:else}
  {@render children()}
{/if}
