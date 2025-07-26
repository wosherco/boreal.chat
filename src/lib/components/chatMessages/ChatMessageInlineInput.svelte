<script lang="ts">
  import { safe } from "@orpc/client";
  import { orpc } from "$lib/client/orpc";
  import { ChevronDownIcon, Loader2Icon } from "@lucide/svelte";
  import { Button } from "../ui/button";
  import KeyboardShortcuts from "../utils/KeyboardShortcuts.svelte";
  import ModelPickerPopover from "../chatInput/ModelPickerPopover/ModelPickerPopover.svelte";
  import { MODEL_DETAILS, type ModelId } from "$lib/common/ai/models";
  import { TextareaAutosize } from "runed";
  import { verifySession } from "$lib/client/services/turnstile.svelte";
  import { toast } from "svelte-sonner";

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
      const sendRequest = () =>
        safe(
          orpc.v1.chat.sendMessage({
            parentMessageId,
            message: editValue,
            chatId,
            model: selectedModel,
          }),
        );

      const { error, isDefined, isSuccess, data } = await sendRequest();

      if (isSuccess) {
        await onSubmit(data.threadId, data.userMessageId);
      } else {
        if (isDefined && error.code === "SESSION_NOT_VERIFIED") {
          const verified = await verifySession();

          if (!verified) {
            toast.error("Failed to verify session");
            return;
          }

          const retryRes = await sendRequest();
          const { error, isSuccess } = retryRes;

          if (isSuccess) {
            await onSubmit(retryRes.data.threadId, retryRes.data.userMessageId);
          } else {
            toast.error("message" in error ? error.message : "Failed to edit message");
          }
        } else {
          toast.error("message" in error ? error.message : "Failed to edit message");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to edit message");
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
    class="w-full resize-none bg-transparent px-4 py-3 focus:outline-none"
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
