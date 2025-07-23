<script lang="ts" module>
  let sidebarCollapsed = $state(false);

  export const isSidebarCollapsed = () => sidebarCollapsed;
  export const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed = collapsed;
  };
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import type { LayoutProps } from "./$types";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import { useCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { browser } from "$app/environment";
  import Cookies from "js-cookie";
  import { SIDEBAR_COLLAPSED_COOKIE } from "$lib/common/cookies";
  import { Button } from "$lib/components/ui/button";
  import { MenuIcon, SidebarCloseIcon, SidebarOpenIcon } from "@lucide/svelte";
  import KeyboardShortcuts from "$lib/components/utils/KeyboardShortcuts.svelte";
  import { Sheet, SheetContent, SheetTrigger } from "$lib/components/ui/sheet";
  import { cn } from "$lib/utils";
  import { goto } from "$app/navigation";
  import { useChats } from "$lib/client/hooks/useChats.svelte";

  const { data, children }: LayoutProps = $props();

  const currentUser = useCurrentUser(data.auth.currentUserInfo);
  const chats = useChats(data.lastChats ?? null);

  setSidebarCollapsed(data.sidebarCollapsed);

  onMount(() => {
    if (!browser) return;

    const sidebarCollapsed = Cookies.get(SIDEBAR_COLLAPSED_COOKIE) === "true";

    setSidebarCollapsed(sidebarCollapsed);
  });

  $effect(() => {
    if (!browser) return;

    Cookies.set(SIDEBAR_COLLAPSED_COOKIE, isSidebarCollapsed().toString());
  });

  function onNewChat() {
    goto("/", {
      keepFocus: true,
    });
  }
</script>

{#snippet sidebar(isPhone = false)}
  <Sidebar
    loading={$currentUser.loading}
    user={$currentUser.data}
    {onNewChat}
    chats={$chats}
    {isPhone}
  />
{/snippet}

<KeyboardShortcuts
  combos={[
    {
      key: "o",
      isControl: true,
      isShift: true,
      callback: onNewChat,
    },
    {
      key: "b",
      isControl: true,
      callback: () => {
        setSidebarCollapsed(!isSidebarCollapsed());
      },
    },
  ]}
/>

<!-- Floating buttons -->
<div
  class={cn(
    "bg-accent/40 fixed z-50 m-2 rounded-lg p-1 backdrop-blur-lg transition-colors",
    isSidebarCollapsed() ? "md:bg-accent/40" : "md:bg-transparent",
  )}
>
  <Button
    variant="ghost"
    size="icon"
    class="hidden md:flex"
    onclick={() => setSidebarCollapsed(!isSidebarCollapsed())}
  >
    {#if isSidebarCollapsed()}
      <SidebarOpenIcon />
    {:else}
      <SidebarCloseIcon />
    {/if}
  </Button>

  <!-- Phone Sidebar -->
  <Sheet>
    <SheetTrigger class="block md:hidden">
      <Button
        variant="ghost"
        size="icon"
        class="md:hidden"
        onclick={() => setSidebarCollapsed(!isSidebarCollapsed())}
      >
        <MenuIcon />
      </Button>
    </SheetTrigger>
    <SheetContent side="left" class="w-fit" renderCloseButton={false}>
      {@render sidebar(true)}
    </SheetContent>
  </Sheet>
</div>

<div class="h-pwa flex w-full flex-row">
  <!-- Desktop Sidebar -->
  <div
    class={cn(
      "hidden flex-shrink-0 overflow-hidden transition-all md:block",
      isSidebarCollapsed() ? "w-0" : "w-80",
    )}
  >
    {@render sidebar()}
  </div>

  <div class="relative flex-1 flex-grow">
    {@render children()}
  </div>
</div>
