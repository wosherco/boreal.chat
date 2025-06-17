<script lang="ts">
  import { orpc } from "$lib/client/orpc";
  import { Loader2Icon } from "@lucide/svelte";
  import { Button } from "../ui/button";
  import KeyboardShortcuts from "../utils/KeyboardShortcuts.svelte";

  interface Props {
    defaultValue: string;
    onSubmit: (newThreadId: string) => void;
    parentMessageId: string | null;
    chatId: string;
    onCancel: () => void;
  }

  const { defaultValue, onSubmit, parentMessageId, chatId, onCancel }: Props = $props();

  let editTextAreaElement = $state<HTMLTextAreaElement>();
  let editValue = $state(defaultValue);

  $effect(() => {
    editValue = defaultValue;
  });

  // Auto-growing textarea logic for editing
  const lineHeight = 24; // Line height in pixels
  const minHeight = 40; // Minimum height for the textarea
  let editTextareaHeight = $state("auto");

  // Auto-resize textarea based on content
  $effect(() => {
    if (editTextAreaElement && editValue !== undefined) {
      // Reset height to auto to get accurate scrollHeight
      editTextAreaElement.style.height = "auto";

      // Calculate new height based on content
      const scrollHeight = editTextAreaElement.scrollHeight;
      const newHeight = Math.max(scrollHeight, minHeight);

      // Apply the calculated height
      editTextAreaElement.style.height = `${newHeight}px`;
      editTextareaHeight = `${newHeight}px`;
    }
  });

  let loading = $state(false);

  function cancelEdit() {
    if (loading) return;

    onCancel();
  }

  async function saveEdit() {
    if (loading) return;

    loading = true;

    try {
      const result = await orpc.v1.chat.sendMessage({
        parentMessageId,
        message: editValue,
        chatId,
      });

      onSubmit(result.threadId);
    } finally {
      loading = false;
    }
  }
</script>

<KeyboardShortcuts
  combos={[
    {
      key: "Enter",
      isControl: true,
      needsFocusedElement: editTextAreaElement,
      callback: saveEdit,
    },
  ]}
/>

<div class="bg-muted border-input w-full rounded-lg border shadow-sm">
  <!-- svelte-ignore a11y_autofocus -->
  <textarea
    bind:this={editTextAreaElement}
    bind:value={editValue}
    style="height: {editTextareaHeight}; line-height: {lineHeight}px;"
    class="w-full resize-none bg-transparent p-2 transition-all duration-150 ease-out focus:outline-none"
    placeholder="Edit your message..."
    autofocus
  ></textarea>
  <div class="flex flex-row items-center justify-end gap-2 p-2 pt-0">
    <Button variant="ghost" size="sm" onclick={cancelEdit} disabled={loading}>Cancel</Button>
    <Button size="sm" onclick={saveEdit} disabled={loading}>
      {#if loading}
        <Loader2Icon class="animate-spin" />
      {:else}
        Save
      {/if}
    </Button>
  </div>
</div>
