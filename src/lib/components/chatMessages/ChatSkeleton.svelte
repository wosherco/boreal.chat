<script lang="ts">
  import ChatMessageSkeleton from "./ChatMessageSkeleton.svelte";

  interface Props {
    messageCount?: number;
  }

  let { messageCount = 8 }: Props = $props();

  // Generate a pattern of user/assistant messages with some randomization
  const messages = Array.from({ length: messageCount }, (_, i) => ({
    id: i,
    isUser: i % 3 === 0, // This creates a pattern where every 3rd message is from user (more realistic)
  }));
</script>

{#each messages as message (message.id)}
  <ChatMessageSkeleton isUser={message.isUser} />
{/each}
