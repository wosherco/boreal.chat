<script lang="ts">
  import { orpc } from "$lib/client/orpc";
  import { ChevronDownIcon, Loader2Icon } from "@lucide/svelte";
  import { Button } from "../ui/button";
  import KeyboardShortcuts from "../utils/KeyboardShortcuts.svelte";
  import ModelPickerPopover from "../chatInput/ModelPickerPopover.svelte";
  import { MODEL_DETAILS, type ModelId } from "$lib/common/ai/models";
  import { TextareaAutosize } from "runed";

  interface Props {
    defaultValue: string;
    onSubmit: (newThreadId: string, newMessageId: string) => Promise<void> | void;
    parentMessageId: string | null;
    chatId: string;
    onCancel: () => void;
    model: ModelId;
  }

  const { defaultValue, onSubmit, parentMessageId, chatId, onCancel, model }: Props = $props();

  let editTextAreaElement = $state<HTMLTextAreaElement>();
  let editValue = $derived(defaultValue);
  let selectedModel = $state(model);

  new TextareaAutosize({
    element: () => editTextAreaElement,
    input: () => editValue,
    maxHeight: undefined,
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
        model: selectedModel,
      });

      await onSubmit(result.threadId, result.userMessageId);
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
    class="w-full resize-none bg-transparent p-2 transition-all duration-150 ease-out focus:outline-none"
    placeholder="Edit your message..."
    autofocus
  ></textarea>
  <div class="flex flex-row items-center justify-between gap-2 p-2 pt-0">
    <ModelPickerPopover
      {selectedModel}
      onSelect={(newModel) => {
        selectedModel = newModel;
      }}
    >
      <Button variant="ghost">
        {MODEL_DETAILS[selectedModel].displayName}
        <ChevronDownIcon class="h-4 w-4" />
      </Button>
    </ModelPickerPopover>
    <div class="flex flex-row items-center justify-end gap-2">
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
</div>
