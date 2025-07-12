<script lang="ts">
  import { orpc, orpcQuery } from "$lib/client/orpc";
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
  import { afterNavigate, goto, onNavigate } from "$app/navigation";
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
  import { TextareaAutosize, useDebounce } from "runed";
  import DraftManager from "../drafts/DraftManager.svelte";
  import type { Draft } from "$lib/common/sharedTypes";
  import { FileTextIcon } from "@lucide/svelte";
  import { VoiceMessageService } from "$lib/client/services/voiceMessageService.svelte";
  import { env } from "$env/dynamic/public";
  import { createMutation } from "@tanstack/svelte-query";
  import { gotoWithSeachParams } from "$lib/utils/navigate";
  import { untrack } from "svelte";
  import { m } from '$lib/paraglide/messages.js';

  interface Props {
    /**
     * @bindable
     */
    textAreaElement?: HTMLTextAreaElement;
    draft: Draft | null;
  }

  let { textAreaElement = $bindable(), draft }: Props = $props();

  let value = $state(page.url.searchParams.get("prompt") ?? "");
  let loading = $state(false);
  let prevDraftId = $state<string | undefined>(undefined);

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

  // Reactive statement to adjust textarea height
  new TextareaAutosize({
    element: () => textAreaElement,
    input: () => value,
    maxHeight: 24 * 9,
  });

  async function onSendMessage() {
    if (loading) return;
    loading = true;

    try {
      const currentChatState = getCurrentChatState();
      // Cancel any pending draft saves
      debouncedSaveDraft.cancel();

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
            draftId: draft?.id,
          });

          value = "";
        } catch (e) {
          if (e instanceof ORPCError) {
            toast.error(e.message);
          } else {
            toast.error(m.error_failedtosendmessage3());
          }
        }
      } else {
        try {
          const chatDetails = await orpc.v1.chat.newChat({
            model: actualSelectedModel,
            message: value,
            reasoningLevel: actualReasoningLevel,
            webSearchEnabled: actualWebSearchEnabled,
            draftId: draft?.id,
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
            toast.error(m.error_failedtocreatechat3());
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
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

  onNavigate(({ from, to }) => {
    // This means we're going out of the new chat page, or the current chat page, and we want to save the draft
    if (from?.url.pathname !== to?.url.pathname) {
      debouncedSaveDraft.runScheduledNow();
    }
  });

  $effect(() => {
    if (draft?.id !== untrack(() => prevDraftId)) {
      debouncedSaveDraft.runScheduledNow();
      prevDraftId = draft?.id;
      value = draft?.content ?? "";
      selectedModel = draft?.selectedModel ?? untrack(() => actualSelectedModel);
      webSearchEnabled = draft?.webSearchEnabled ?? untrack(() => actualWebSearchEnabled);
      reasoningLevel = draft?.reasoningLevel ?? untrack(() => actualReasoningLevel);
    }
  });

  let modelPickerOpen = $state(false);

  const isLastMessageFinished = $derived.by(() => {
    const currentChatState = getCurrentChatState();
    return currentChatState?.lastMessageStatus
      ? isFinishedMessageStatus(currentChatState.lastMessageStatus)
      : true;
  });

  const upsertDraftMutation = createMutation(
    orpcQuery.v1.draft.upsert.mutationOptions({
      onSuccess: (draft) => {
        gotoWithSeachParams(page.url, {
          searchParams: {
            draft: draft.id,
          },
        });
      },
      onError: (error) => {
        console.error(m.error_failedtosavedraft3(), error);
      },
    }),
  );

  const deleteDraftMutation = createMutation(
    orpcQuery.v1.draft.delete.mutationOptions({
      onSuccess: () => {
        gotoWithSeachParams(page.url, {
          searchParams: {
            draft: undefined,
          },
        });
      },
      onError: (error) => {
        console.error(m.error_failedtodeletedraft3(), error);
      },
    }),
  );

  // Draft functionality
  async function saveDraft() {
    if (loading) return;

    if (!value.trim()) {
      if (prevDraftId) {
        // We delete the draft
        $deleteDraftMutation.mutate({
          id: prevDraftId,
        });
      }
    } else {
      $upsertDraftMutation.mutate({
        id: prevDraftId,
        content: value,
        selectedModel: actualSelectedModel,
        reasoningLevel: actualReasoningLevel,
        webSearchEnabled: actualWebSearchEnabled,
      });
    }
  }

  const debouncedSaveDraft = useDebounce(() => saveDraft(), 1000);

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
      toast.error(m.error_failedtoaccessmicrophone3());
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
    const result = await voiceMessageService.stopRecording();

    if (!result) {
      voiceMessageService.reset();
      toast.error(m.error_failedtostoprecording3());
      return;
    }

    try {
      const { transcript } = await orpc.v1.voice.transcribe({
        audioBlob: result.audioBlob,
        duration: result.duration / 1000,
      });

      value += transcript;
    } catch (error) {
      console.error(error);
      toast.error(m.error_failedtotranscribevoice3());
    } finally {
      voiceMessageService.reset();
    }
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
        oninput={debouncedSaveDraft}
        placeholder={m.chat_messageinputplaceholder()}
        class="placeholder:text-muted-foreground min-h-20 w-full resize-none overflow-y-auto border-none bg-transparent p-4 pb-2 focus:ring-0 focus:outline-none"
      ></textarea>

      <div class="flex items-center justify-between p-2 pt-0">
        <div class="flex items-center gap-2">
          <DraftManager>
            <Button variant="ghost" size="icon" disabled={loading || !browser}>
              <FileTextIcon class="h-4 w-4" />
            </Button>
          </DraftManager>

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
            <span class="hidden text-xs md:block">{m.chat_websearch()}</span>
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
                <SelectItem value="none">{m.chat_reasoningnone()}</SelectItem>
                <SelectItem value="low">{m.chat_reasoninglow()}</SelectItem>
                <SelectItem value="medium">{m.chat_reasoningmedium()}</SelectItem>
                <SelectItem value="high">{m.chat_reasoninghigh()}</SelectItem>
              </SelectContent>
            </Select>
          {/if}
        </div>

        <div class="flex items-center gap-2">
          {#if env.PUBLIC_VOICE_INPUT_ENABLED}
            <Button
              variant="secondary"
              size="icon"
              disabled={loading || !browser || voiceMessageService.state === "error"}
              onclick={startRecording}
            >
              <MicIcon class="h-4 w-4" />
            </Button>
          {/if}

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
      <!-- Voice recording UI -->
      <div class="flex items-center justify-center p-4">
        <div class="flex flex-col items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
              {#each volumeLevels as level}
                <div
                  class="w-1 bg-primary rounded-full transition-all duration-75"
                  style:height="{Math.max(4, level * 20)}px"
                ></div>
              {/each}
            </div>
            <MicIcon class="h-5 w-5" />
          </div>
          <div class="flex items-center gap-2">
            {#if voiceMessageService.state === "recording"}
              <Button variant="ghost" size="sm" onclick={pauseRecording}>
                Pause
              </Button>
            {:else if voiceMessageService.state === "paused"}
              <Button variant="ghost" size="sm" onclick={resumeRecording}>
                Resume
              </Button>
            {/if}
            <Button variant="destructive" size="sm" onclick={stopRecording}>
              Stop
            </Button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
