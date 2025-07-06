<script lang="ts">
  import { orpc } from "$lib/client/orpc";
  import {
    MODEL_DETAILS,
    type ReasoningLevel,
    type ModelId,
    GEMINI_FLASH_2_5,
  } from "$lib/common/ai/models";
  import {
    BrainIcon,
    ChevronDownIcon,
    GlobeIcon,
    Loader2Icon,
    MicIcon,
    SendIcon,
    StopCircleIcon,
  } from "@lucide/svelte";
  import { Button } from "../ui/button";
  import KeyboardShortcuts from "../utils/KeyboardShortcuts.svelte";
  import ModelPickerPopover from "./ModelPickerPopover.svelte";
  import { afterNavigate, goto } from "$app/navigation";
  import { syncStreams } from "$lib/client/db/index.svelte";
  import { getCurrentChatState } from "$lib/client/state/currentChatState.svelte";
  import { Toggle } from "../ui/toggle";
  import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
  import { ORPCError } from "@orpc/client";
  import { browser } from "$app/environment";
  import { toast } from "svelte-sonner";
  import { page } from "$app/state";
  import { getLastSelectedModel, setLastSelectedModel } from "$lib/utils/localStorage";
  import { isFinishedMessageStatus } from "$lib/common";
  import { waitForInsert } from "$lib/client/hooks/waitForInsert";
  import { chatTable, messageTable } from "$lib/client/db/schema";
  import { VoiceMessageService } from "$lib/client/services/voiceMessageService.svelte";

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
                waitForInsert(chatTable, chatDetails.chatId, 5000),
                waitForInsert(messageTable, chatDetails.userMessageId, 5000),
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

  async function onCancelMessage() {
    if (loading) return;
    loading = true;

    try {
      const currentChatState = getCurrentChatState();

      if (currentChatState?.lastMessageId) {
        await orpc.v1.chat.cancelMessage({
          messageId: currentChatState.lastMessageId,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      loading = false;
    }
  }

  afterNavigate(({ to }) => {
    if (!to) return;

    const urlPrompt = to.url.searchParams.get("prompt");
    if (urlPrompt && (!value || to.url.searchParams.has("forcePrompt"))) {
      value = urlPrompt;
    }
  });

  let modelPickerOpen = $state(false);

  const isLastMessageFinished = $derived.by(() => {
    const currentChatState = getCurrentChatState();
    return currentChatState?.lastMessageStatus
      ? isFinishedMessageStatus(currentChatState.lastMessageStatus)
      : true;
  });

  // Mic stuff
  const voiceMessageService = new VoiceMessageService();
  const volumeLevels = $derived.by(() => {
    const levels = voiceMessageService.volumeLevels.slice(-20);
    const remaining = new Array(20 - levels.length).fill(0);
    return [...remaining, ...levels];
  });

  async function startRecording() {
    const valid = await voiceMessageService.startRecording();
    if (!valid) {
      toast.error("Failed to access microphone. Please, allow access in your browser settings.");
      return;
    }
  }

  async function pauseRecording() {
    await voiceMessageService.pauseRecording();
  }

  async function resumeRecording() {
    await voiceMessageService.resumeRecording();
  }

  async function stopRecording() {
    await voiceMessageService.stopRecording();
  }
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
    {
      key: "m",
      isControl: true,
      callback: () => {
        modelPickerOpen = !modelPickerOpen;
      },
    },
  ]}
/>

<div class="mx-auto w-full max-w-screen-md px-4">
  <div
    class="bg-muted/50 group pointer-events-auto z-50 flex w-full flex-col gap-3 rounded-lg rounded-b-none border border-b-0 shadow backdrop-blur transition-colors focus-within:border-white"
    style:padding-bottom="env(safe-area-inset-bottom)"
  >
    {#if voiceMessageService.state === "idle" || voiceMessageService.state === "error"}
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
            bind:open={modelPickerOpen}
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
                <span class="hidden sm:block">
                  {actualReasoningLevel.charAt(0).toUpperCase() + actualReasoningLevel.slice(1)}
                </span>
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
          <Button
            variant="secondary"
            size="icon"
            disabled={loading || !browser || voiceMessageService.state === "error"}
            onclick={startRecording}
          >
            <MicIcon class="h-4 w-4" />
          </Button>
          <Button
            disabled={(!value.trim() && isLastMessageFinished) || loading || !browser}
            onclick={isLastMessageFinished ? onSendMessage : onCancelMessage}
            size="icon"
          >
            {#if loading}
              <Loader2Icon class="animate-spin" />
            {:else if !isLastMessageFinished}
              <StopCircleIcon />
            {:else}
              <SendIcon />
            {/if}
          </Button>
        </div>
      </div>
    {:else}
      <div class="flex flex-col gap-3 p-4">
        <!-- Controls row -->
        <div class="flex items-center justify-between">
          <!-- Cancel button on the left -->
          <Button
            variant="outline"
            size="sm"
            onclick={async () => {
              voiceMessageService.cancelRecording();
            }}
            class="text-destructive hover:text-destructive"
          >
            Cancel
          </Button>

          <!-- Pause/Resume and Finish buttons on the right -->
          <div class="flex items-center gap-2">
            {#if voiceMessageService.state === "recording"}
              <Button variant="outline" size="sm" onclick={pauseRecording}>Pause</Button>
            {:else if voiceMessageService.state === "paused"}
              <Button variant="outline" size="sm" onclick={resumeRecording}>Resume</Button>
            {/if}

            <Button variant="default" size="sm" onclick={stopRecording}>Finish</Button>
          </div>
        </div>

        <!-- Volume visualization -->
        <div class="flex flex-col items-center gap-2">
          <!-- Animated vertical bars -->
          <div class="flex h-12 items-end gap-1">
            {#each volumeLevels as level, index}
              <div
                class="bg-primary rounded-sm transition-all duration-75 ease-out"
                style="width: 3px; height: {Math.max(2, level * 48)}px; opacity: {0.3 +
                  level * 0.7};"
              ></div>
            {/each}
          </div>

          <!-- Duration display -->
          <div class="text-muted-foreground font-mono text-sm">
            {Math.floor(voiceMessageService.duration / 60)}:{String(
              voiceMessageService.duration % 60,
            ).padStart(2, "0")}
          </div>

          <!-- Recording state indicator -->
          <div class="text-muted-foreground flex items-center gap-2 text-xs">
            {#if voiceMessageService.state === "recording"}
              <div class="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
              Recording...
            {:else if voiceMessageService.state === "paused"}
              <div class="h-2 w-2 rounded-full bg-yellow-500"></div>
              Paused
            {:else if voiceMessageService.state === "processing"}
              <div class="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
              Processing...
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
