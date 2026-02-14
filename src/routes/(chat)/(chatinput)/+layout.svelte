<script lang="ts">
  import { page } from "$app/state";
  import { createCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import { createDraft } from "$lib/client/hooks/useDraft.svelte";
  import { isSubscribed } from "$lib/common/utils/subscription";
  import ChatMessageInput from "$lib/components/chatInput/ChatMessageInput.svelte";
  import { getDraftIdFromUrl } from "$lib/utils/drafts";
  import { ArrowDownIcon } from "@lucide/svelte";
  import type { LayoutProps } from "./$types";
  import { fade } from "svelte/transition";
  import { onMount, setContext } from "svelte";
  import { afterNavigate } from "$app/navigation";
  import { createDraftCount } from "$lib/client/hooks/useDraftCount.svelte";

  const { data, children }: LayoutProps = $props();

  // Auto scroll functionality
  let chatContainer = $state<HTMLElement>();
  let autoscroll = $state(true);

  setContext("chatContainer", () => chatContainer);

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

  // Draft functionality
  const currentDraftId = $derived(getDraftIdFromUrl(page.url));
  const currentDraft = createDraft(
    () => data.draft ?? null,
    () => currentDraftId,
  );

  const currentUser = createCurrentUser(() => data.auth.currentUserInfo);
  const draftCount = createDraftCount(() => null);
</script>

<main class="relative h-full overflow-y-auto" bind:this={chatContainer} onscroll={handleScroll}>
  {@render children()}
</main>

<!-- Chat message input -->
<div class="pointer-events-none absolute right-0 bottom-0 left-0 w-full overflow-y-hidden">
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
  <ChatMessageInput
    draft={currentDraft.data ?? null}
    isUserSubscribed={isSubscribed(currentUser.data?.data ?? null)}
    draftCount={draftCount.data ?? 0}
  />
</div>
