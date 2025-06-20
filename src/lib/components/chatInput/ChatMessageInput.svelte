<script lang="ts">
  import { orpc } from "$lib/client/orpc";
  import {
    MODEL_DETAILS,
    type ReasoningLevel,
    type ModelId,
    GEMINI_FLASH_2_5,
  } from "$lib/common/ai/models";
  import { BrainIcon, ChevronDownIcon, GlobeIcon, Loader2Icon, SendIcon } from "@lucide/svelte";
  import { Button } from "../ui/button";
  import KeyboardShortcuts from "../utils/KeyboardShortcuts.svelte";
  import ModelPickerPopover from "./ModelPickerPopover.svelte";
  import { afterNavigate, goto } from "$app/navigation";
  import { syncStreams } from "$lib/client/db/index.svelte";
  import { matchBy, matchStream } from "@electric-sql/experimental";
  import { getCurrentChatState } from "$lib/client/state/currentChatState.svelte";
  import { Toggle } from "../ui/toggle";
  import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
  import { ORPCError } from "@orpc/client";
  import { browser } from "$app/environment";
  import { toast } from "svelte-sonner";
  import { page } from "$app/state";
  import { getLastSelectedModel, setLastSelectedModel } from "$lib/utils/localStorage";

  interface Props {
    /**
     * @bindable
     */
    textAreaElement?: HTMLTextAreaElement;
  }

  let { textAreaElement = $bindable() }: Props = $props();

  let value = $state(page.url.searchParams.get("prompt") ?? "");
  let loading = $state(false);

  const defaultSelectedModel = browser ? getLastSelectedModel() : GEMINI_FLASH_2_5;
  const defaultWebSearchEnabled = false;
  const defaultReasoningLevel = "low";

  let selectedModel = $state<ModelId | undefined>(undefined);
  let webSearchEnabled = $state<boolean | undefined>(undefined);
  let reasoningLevel = $state<ReasoningLevel | undefined>(undefined);

  const actualSelectedModel = $derived(
    selectedModel ?? getCurrentChatState()?.model ?? defaultSelectedModel,
  );
  const actualWebSearchEnabled = $derived(
    webSearchEnabled ?? getCurrentChatState()?.webSearchEnabled ?? defaultWebSearchEnabled,
  );
  const actualReasoningLevel = $derived(
    reasoningLevel ?? getCurrentChatState()?.reasoningLevel ?? defaultReasoningLevel,
  );

  let textareaHeight = $state("auto");
  const minHeight = 48; // min-h-12 = 3rem = 48px
  const lineHeight = 24; // Approximate line height in pixels
  const maxLines = 10;
  const maxHeight = minHeight + lineHeight * (maxLines - 1); // Calculate max height for 6 lines

  // Reactive statement to adjust textarea height
  $effect(() => {
    if (textAreaElement && value !== undefined) {
      // Reset height to auto to get accurate scrollHeight
      textAreaElement.style.height = "auto";

      // Calculate new height based on content
      const scrollHeight = textAreaElement.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

      // Apply the calculated height
      textAreaElement.style.height = `${newHeight}px`;
      textareaHeight = `${newHeight}px`;
    }
  });

  async function onSendMessage() {
    if (loading) return;
    loading = true;

    try {
      const currentChatState = getCurrentChatState();

      if (currentChatState) {
        // We're replying to a message
        try {
          await orpc.v1.chat.sendMessage({
            chatId: currentChatState.chatId,
            model: actualSelectedModel,
            parentMessageId: currentChatState.lastMessageId,
            message: value,
            reasoningLevel: actualReasoningLevel,
            webSearchEnabled: actualWebSearchEnabled,
          });

          value = "";
        } catch (e) {
          if (e instanceof ORPCError) {
            toast.error(e.message);
          } else {
            toast.error("Failed to send message");
          }
        }
      } else {
        try {
          const chatDetails = await orpc.v1.chat.newChat({
            model: actualSelectedModel,
            message: value,
            reasoningLevel: actualReasoningLevel,
            webSearchEnabled: actualWebSearchEnabled,
          });
          value = "";

          const chatStream = syncStreams()?.streams.chat;
          const messagesStream = syncStreams()?.streams.message;
          if (chatStream && messagesStream) {
            try {
              await Promise.all([
                matchStream(chatStream, ["insert"], matchBy("id", chatDetails.chatId), 5000),
                matchStream(
                  messagesStream,
                  ["insert"],
                  matchBy("id", chatDetails.userMessageId),
                  5000,
                ),
              ]);
            } catch (err) {
              console.error("Waiting for chat sync failed", err);
            }
          }

          await goto(`/chat/${chatDetails.chatId}`);
        } catch (e) {
          if (e instanceof ORPCError) {
            toast.error(e.message);
          } else {
            toast.error("Failed to create chat");
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      loading = false;
    }
  }

  $effect(() => {});

  afterNavigate(({ to }) => {
    if (!to) return;

    const urlPrompt = to.url.searchParams.get("prompt");
    if (urlPrompt && (!value || to.url.searchParams.has("forcePrompt"))) {
      value = urlPrompt;
    }
  });
</script>

<KeyboardShortcuts
  combos={[
    {
      key: "Enter",
      isControl: true,
      validate: (event) => {
        return (
          event.target === textAreaElement &&
          event.target instanceof HTMLTextAreaElement &&
          event.target.value.trim() !== ""
        );
      },
      needsFocusedElement: textAreaElement,
      callback: onSendMessage,
    },
    {
      key: "j",
      isControl: true,
      callback: () => {
        textAreaElement?.focus();
      },
    },
  ]}
/>

<div class="mx-auto w-full max-w-screen-md">
  <div
    class="bg-muted/50 group flex w-full flex-col gap-3 rounded-lg rounded-b-none border border-b-0 shadow backdrop-blur transition-all md:focus-within:-translate-y-1 md:focus-within:rounded-b-lg md:focus-within:border-b"
  >
    <!-- svelte-ignore a11y_autofocus -->
    <textarea
      autocomplete="off"
      autofocus={browser}
      disabled={loading}
      bind:this={textAreaElement}
      bind:value
      placeholder="Message Bot..."
      style="height: {textareaHeight}; line-height: {lineHeight}px;"
      class="placeholder:text-muted-foreground w-full resize-none overflow-y-auto border-none bg-transparent p-4 pb-2 transition-all duration-150 ease-out focus:ring-0 focus:outline-none"
    ></textarea>

    <div class="flex items-center justify-between p-2 pt-0">
      <div class="flex items-center gap-2">
        <ModelPickerPopover
          selectedModel={actualSelectedModel}
          onSelect={(newModel) => {
            selectedModel = newModel;
            setLastSelectedModel(newModel);
          }}
        >
          <Button variant="ghost">
            {MODEL_DETAILS[actualSelectedModel].displayName}
            <ChevronDownIcon class="h-4 w-4" />
          </Button>
        </ModelPickerPopover>

        <Toggle
          pressed={actualWebSearchEnabled}
          onPressedChange={(newWebSearchEnabled) => (webSearchEnabled = newWebSearchEnabled)}
          class="text-sm"
          variant="outline"
        >
          <GlobeIcon />
          <span class="hidden text-xs md:block">Web Search</span>
        </Toggle>

        {#if MODEL_DETAILS[actualSelectedModel].reasoning}
          <Select
            type="single"
            value={actualReasoningLevel}
            onValueChange={(newValue) => (reasoningLevel = newValue as ReasoningLevel)}
          >
            <SelectTrigger>
              <BrainIcon />
              {actualReasoningLevel.charAt(0).toUpperCase() + actualReasoningLevel.slice(1)}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        {/if}
      </div>

      <div class="flex items-center gap-2">
        <!-- TODO: Add whisper support -->
        <!-- <Button variant="secondary" size="icon" disabled={loading || !browser}>
          <MicIcon class="h-4 w-4" />
        </Button> -->
        <Button disabled={!value.trim() || loading || !browser} onclick={onSendMessage} size="icon">
          {#if loading}
            <Loader2Icon class="h-4 w-4 animate-spin" />
          {:else}
            <SendIcon class="h-4 w-4" />
          {/if}
        </Button>
      </div>
    </div>
  </div>
</div>
