<script lang="ts" module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import ChatInputButton from "$lib/components/chatInput/ChatInputButton.svelte";
  import { SendIcon, MicIcon } from "@lucide/svelte";

  const { Story } = defineMeta({
    title: "Chat/Input Button",
    component: ChatInputButton,
  });
</script>

<Story name="Icon and Text" tags={["autodocs"]}>
  {#snippet template()}
    <div class="flex gap-4 p-6">
      <ChatInputButton>
        <SendIcon class="size-3.5 md:size-4" />
        <span class="hidden md:inline">Send</span>
      </ChatInputButton>

      <ChatInputButton>
        <MicIcon class="size-3.5 md:size-4" />
        <span class="hidden md:inline">Record</span>
      </ChatInputButton>
    </div>
  {/snippet}
</Story>

<Story name="Icon Only" tags={["autodocs"]}>
  {#snippet template()}
    <div class="flex items-center gap-4 p-6">
      <ChatInputButton aria-label="Send">
        <SendIcon class="size-3.5 md:size-4" />
      </ChatInputButton>
      <ChatInputButton aria-label="Record">
        <MicIcon class="size-3.5 md:size-4" />
      </ChatInputButton>
    </div>
  {/snippet}
</Story>
