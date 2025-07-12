<script lang="ts">
  import type { PageProps } from "./$types";
  import { cn } from "$lib/utils";
  import { isSidebarCollapsed } from "../../+layout.svelte";
  import ChatMessage from "$lib/components/chatMessages/ChatMessage.svelte";
  import SvelteSeo from "svelte-seo";

  const { data }: PageProps = $props();
</script>

<SvelteSeo title="Shared Thread | boreal.chat" nofollow noindex />

<div
  class={cn(
    "mx-auto flex w-full max-w-screen min-w-0 flex-col gap-2 overflow-x-hidden px-4 pt-16 pb-36",
    isSidebarCollapsed()
      ? "md:max-w-screen-md"
      : "md:max-w-[min(var(--breakpoint-md),calc(100vw-var(--spacing)*80)))]",
  )}
>
  {#each data.share.messages as message (message.id)}
    <ChatMessage {message} isSharedView={true} />
  {/each}
</div>
