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
  import { afterNavigate, goto, onNavigate } from "$app/navigation";
  import { syncStreams } from "$lib/client/db/index.svelte";
  import { getCurrentChatState } from "$lib/client/state/currentChatState.svelte";
  import { Toggle } from "../ui/toggle";
  import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
  import { safe, ORPCError } from "@orpc/client";
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
  import { PremiumWrapper } from "../ui/premium-badge";
  import { verifySession } from "$lib/client/services/turnstile.svelte";
  import OptionsMenu from "./OptionsMenu.svelte";
  import { ICON_MAP } from "../icons/iconMap";
  import UploadFileButton from "./UploadFileButton.svelte";

  interface Props {
    /**
     * @bindable
     */
    textAreaElement?: HTMLTextAreaElement;
    draft: Draft | null;
    isUserSubscribed: boolean;
  }

  let { textAreaElement = $bindable(), draft, isUserSubscribed }: Props = $props();

  let value = $state(page.url.searchParams.get("prompt") ?? "");
  let loading = $state(false);
  let prevDraftId = $state<string | undefined>(undefined);

  const defaultSelectedModel = browser ? getLastSelectedModel() : GEMINI_FLASH_2_5;
  const defaultWebSearchEnabled = false;
  const defaultReasoningLevel = "low";
  const defaultByokId = undefined;

  let selectedModel = $state<ModelId | undefined>(undefined);
  let webSearchEnabled = $state<boolean | undefined>(undefined);
  let reasoningLevel = $state<ReasoningLevel | undefined>(undefined);
  let byokId = $state<string | undefined>(undefined);

  const actualSelectedModel = $derived(
    selectedModel ?? getCurrentChatState()?.model ?? defaultSelectedModel,
  );
  const actualWebSearchEnabled = $derived(
    webSearchEnabled ?? getCurrentChatState()?.webSearchEnabled ?? defaultWebSearchEnabled,
  );
  const actualReasoningLevel = $derived(
    reasoningLevel ?? getCurrentChatState()?.reasoningLevel ?? defaultReasoningLevel,
  );
  const actualByokId = $derived(byokId ?? getCurrentChatState()?.byokId ?? defaultByokId);

  // Reactive statement to adjust textarea height
  new TextareaAutosize({
    element: () => textAreaElement,
    input: () => value,
    maxHeight: 24 * 9,
  });

  async function onSendMessage() {
    if (loading || !isLastMessageFinished) return;
    loading = true;

    const currentChatState = getCurrentChatState();
    const isNewChat = !currentChatState;
    const genericErrorMessage = isNewChat ? "Failed to create chat" : "Failed to send message";

    // Cancel any pending draft saves
    debouncedSaveDraft.cancel();

    try {
      const sendRequest = () =>
        safe(
          currentChatState
            ? orpc.v1.chat.sendMessage({
                chatId: currentChatState.chatId,
                model: actualSelectedModel,
                parentMessageId: currentChatState.lastMessageId,
                message: value,
                reasoningLevel: actualReasoningLevel,
                webSearchEnabled: actualWebSearchEnabled,
                draftId: draft?.id,
                byokId: actualByokId,
              })
            : orpc.v1.chat.newChat({
                model: actualSelectedModel,
                message: value,
                reasoningLevel: actualReasoningLevel,
                webSearchEnabled: actualWebSearchEnabled,
                draftId: draft?.id,
                byokId: actualByokId,
              }),
        );

      const onSuccess = async (
        data: NonNullable<Awaited<ReturnType<typeof sendRequest>>["data"]>,
      ) => {
        value = "";

        if (isNewChat) {
          const chatStream = syncStreams()?.streams.chat;
          const messagesStream = syncStreams()?.streams.message;
          if (chatStream && messagesStream) {
            try {
              await Promise.all([
                waitForInsert(chatTable, data.chatId, 5000),
                waitForInsert(messageTable, data.userMessageId, 5000),
              ]);
            } catch (err) {
              console.error("Waiting for chat sync failed", err);
            }
          }

          await goto(`/chat/${data.chatId}`);
        }
      };

      const res = await sendRequest();
      const { error, isDefined, isSuccess } = res;

      if (isSuccess) {
        await onSuccess(res.data);
        return;
      }

      if (!isDefined) {
        if (error instanceof ORPCError) {
          if (error.status === 401) {
            toast.error("You need to be logged in to use this model");
            return;
          }
          toast.error(error.message);
        } else {
          toast.error(genericErrorMessage);
        }
        return;
      }

      if (error.code === "SESSION_NOT_VERIFIED") {
        const verified = await verifySession();

        if (!verified) {
          toast.error("Failed to verify session");
          return;
        }

        const retryRes = await sendRequest();
        const { error, isDefined, isSuccess } = retryRes;

        if (isSuccess) {
          await onSuccess(retryRes.data);
          return;
        }

        toast.error(isDefined ? error.message : genericErrorMessage);
      } else {
        toast.error(error.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(genericErrorMessage);
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
          chatId: currentChatState.chatId,
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

      if (draft?.selectedModel && !MODEL_DETAILS[draft.selectedModel]) {
        console.warn(`Unknown model: ${draft.selectedModel}`);
        return;
      }

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
        // We set this so the user can keep typing without the draft update losing focus
        prevDraftId = draft.id;
        gotoWithSeachParams(page.url, {
          keepFocus: true,
          noScroll: true,
          searchParams: {
            draft: draft.id,
          },
        });
      },
      onError: (error) => {
        console.error("Failed to save draft:", error);
      },
    }),
  );

  const deleteDraftMutation = createMutation(
    orpcQuery.v1.draft.delete.mutationOptions({
      onSuccess: () => {
        gotoWithSeachParams(page.url, {
          keepFocus: true,
          noScroll: true,
          searchParams: {
            draft: undefined,
          },
        });
      },
      onError: (error) => {
        console.error("Failed to delete draft:", error);
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
    const result = await voiceMessageService.stopRecording();

    if (!result) {
      voiceMessageService.reset();
      toast.error("Failed to stop recording");
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
      toast.error("Failed to transcribe voice message");
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
        id="chat-input"
        autocomplete="off"
        autofocus={browser}
        disabled={loading}
        bind:this={textAreaElement}
        bind:value
        oninput={debouncedSaveDraft}
        placeholder="Message Bot..."
        class="placeholder:text-muted-foreground min-h-20 w-full resize-none overflow-y-auto border-none bg-transparent p-4 pb-2 focus:ring-0 focus:outline-none"
      ></textarea>

      <div class="flex items-center justify-between p-2 pt-0">
        <div class="flex items-center gap-2">
          <DraftManager>
            <Button variant="ghost" size="icon" disabled={loading || !browser}>
              <FileTextIcon class="h-4 w-4" />
            </Button>
          </DraftManager>

          <UploadFileButton />

          <OptionsMenu
            selectedModel={actualSelectedModel}
            onSelectModel={(newModel) => {
              selectedModel = newModel;
              setLastSelectedModel(newModel);
            }}
            bind:open={modelPickerOpen}
            byokId={actualByokId}
            onSelectByok={(newByokId) => (byokId = newByokId)}
          >
            <Button variant="ghost">
              {@const ModelIcon = ICON_MAP[actualSelectedModel]}
              <ModelIcon class="size-4" />
              {MODEL_DETAILS[actualSelectedModel].displayName}
              <ChevronDownIcon class="h-4 w-4" />
            </Button>
          </OptionsMenu>

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
          {#if env.PUBLIC_VOICE_INPUT_ENABLED}
            <PremiumWrapper showBadge={!isUserSubscribed} variant="icon-only">
              <Button
                variant="secondary"
                size="icon"
                disabled={loading ||
                  !browser ||
                  voiceMessageService.state === "error" ||
                  !isUserSubscribed}
                onclick={startRecording}
              >
                <MicIcon class="h-4 w-4" />
              </Button>
            </PremiumWrapper>
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

            {#if voiceMessageService.state === "processing"}
              <Loader2Icon class="animate-spin" />
              Processing...
            {:else}
              <Button variant="default" size="sm" onclick={stopRecording}>Finish</Button>
            {/if}
          </div>
        </div>

        <!-- Volume visualization -->
        <div class="flex flex-col items-center gap-2">
          <!-- Animated vertical bars -->
          <div class="flex h-12 items-end gap-1">
            {#each volumeLevels as level, index (index)}
              <div
                class="bg-primary rounded-sm transition-all duration-75 ease-out"
                style="width: 3px; height: {Math.max(2, level * 48)}px; opacity: {0.3 +
                  level * 0.7};"
              ></div>
            {/each}
          </div>

          <!-- Duration display -->
          <div class="text-muted-foreground font-mono text-sm">
            {voiceMessageService.duration / 1000}
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
