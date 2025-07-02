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
  import { ArrowDownIcon, MenuIcon, SidebarCloseIcon, SidebarOpenIcon } from "@lucide/svelte";
  import KeyboardShortcuts from "$lib/components/utils/KeyboardShortcuts.svelte";
  import { Sheet, SheetContent, SheetTrigger } from "$lib/components/ui/sheet";
  import { cn } from "$lib/utils";
  import ChatMessageInput from "$lib/components/chatInput/ChatMessageInput.svelte";
  import { afterNavigate, goto } from "$app/navigation";
  import { useChats } from "$lib/client/hooks/useChats.svelte";
  import { fade } from "svelte/transition";

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

  let chatMessageInputElement = $state<HTMLTextAreaElement>();

  function onNewChat() {
    goto("/", {
      keepFocus: true,
    });

    if (chatMessageInputElement) {
      chatMessageInputElement.value = "";
      chatMessageInputElement.focus();
    }
  }

  // Auto scroll functionality
  let chatContainer = $state<HTMLElement>();
  let autoscroll = $state(true);

  $effect(() => {
    if (!chatContainer) return;

    // Create MutationObserver to watch for new content (messages)
    const mutationObserver = new MutationObserver((mutations) => {
      // Only trigger if we're adding new content and autoscroll is enabled
      const hasNewContent = mutations.some(
        (mutation) => mutation.type === "childList" && mutation.addedNodes.length > 0,
      );

      if (hasNewContent && autoscroll) {
        if (chatContainer && autoscroll) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }
    });

    // Start observing the chat container for child changes
    mutationObserver.observe(chatContainer, {
      childList: true,
      subtree: true,
    });

    // Cleanup function
    return () => mutationObserver.disconnect();
  });

  onMount(() => {
    resumeAutoScroll();
  });

  afterNavigate(() => {
    resumeAutoScroll();
  });

  function handleScroll() {
    if (!chatContainer) return;

    // Calculate if user scrolled up (with 50px threshold)
    const isAtBottom =
      chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 50;

    if (!isAtBottom && autoscroll) {
      autoscroll = false;
    } else if (isAtBottom && !autoscroll) {
      resumeAutoScroll();
    }
  }

  function resumeAutoScroll() {
    autoscroll = true;
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
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

<!-- Chat message input -->
<div class="pointer-events-none fixed top-0 bottom-0 z-10 w-full overflow-y-hidden">
  <div class="pointer-events-none absolute right-0 bottom-0 left-0">
    {#if !autoscroll}
      <button
        onclick={resumeAutoScroll}
        class="bg-accent/50 hover:bg-accent/80 pointer-events-auto mx-auto mb-2 flex items-center justify-center gap-1 rounded-full p-2 text-sm backdrop-blur-sm transition-colors"
        transition:fade={{ duration: 100 }}
      >
        <ArrowDownIcon class="size-4" />
        Scroll to bottom
      </button>
    {/if}
    <ChatMessageInput bind:textAreaElement={chatMessageInputElement} />
  </div>
</div>

<div class="flex h-[100dvh] w-full flex-row">
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
    <main class="h-full overflow-y-auto" bind:this={chatContainer} onscroll={handleScroll}>
      {@render children()}
    </main>
  </div>
</div>
