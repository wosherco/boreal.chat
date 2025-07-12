<script lang="ts">
  import { orpc } from "$lib/client/orpc";
  import { MODEL_DETAILS, type ModelId } from "$lib/common/ai/models";
  import { Button } from "../ui/button";
  import { ChevronDownIcon, Loader2Icon } from "@lucide/svelte";
  import ModelPickerPopover from "../chatInput/ModelPickerPopover.svelte";
  import { messageTable } from "$lib/client/db/schema";
  import { waitForInsert } from "$lib/client/hooks/waitForInsert";
  import { syncStreams } from "$lib/client/db/index.svelte";
  import { m } from '$lib/paraglide/messages.js';

  interface Props {
    defaultValue: string;
    onSubmit: (message: string, model: ModelId) => void;
    onCancel: () => void;
    parentMessageId?: string;
    chatId: string;
    model: ModelId;
  }

  const { defaultValue, onSubmit, onCancel, parentMessageId, chatId, model }: Props = $props();

  let editValue = $state(defaultValue);
  let editTextAreaElement: HTMLTextAreaElement | null = $state(null);
  let selectedModel = $state(model);
  let loading = $state(false);

  async function saveEdit() {
    if (!editValue.trim() || loading) return;

    loading = true;
    try {
      await orpc.v1.chat.editMessage({
        chatId,
        parentMessageId,
        message: editValue,
        model: selectedModel,
      });

      onSubmit(editValue, selectedModel);
    } catch (error) {
      console.error("Failed to edit message:", error);
    } finally {
      loading = false;
    }
  }

  function cancelEdit() {
    editValue = defaultValue;
    onCancel();
  }
</script>

<div class="bg-muted border-input w-full rounded-lg border shadow-sm">
  <!-- svelte-ignore a11y_autofocus -->
  <textarea
    bind:this={editTextAreaElement}
    bind:value={editValue}
    class="w-full resize-none bg-transparent px-4 py-3 focus:outline-none"
    placeholder={m.chat_edityourmessage()}
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
      <Button variant="ghost" size="sm" onclick={cancelEdit} disabled={loading}>{m.chat_cancel()}</Button>
      <Button size="sm" onclick={saveEdit} disabled={loading}>
        {#if loading}
          <Loader2Icon class="animate-spin" />
        {:else}
          {m.chat_save()}
        {/if}
      </Button>
    </div>
  </div>
</div>
