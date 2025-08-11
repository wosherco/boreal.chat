<script lang="ts" module>
  interface EditingMessage {
    messageId: string;
    cleanedMessageText: string;
    parentMessageId: string | null;
    chatId: string;
    model: ModelId;
    reasoningLevel: ReasoningLevel;
    webSearchEnabled: boolean;
    onSubmitCallback: (newThreadId: string, newMessageId: string) => Promise<void>;
  }

  let editingMessage = $state<EditingMessage | null>(null);

  export const setEditingMessage = (message: EditingMessage) => {
    editingMessage = message;
  };

  export const clearEditingMessage = () => {
    editingMessage = null;
  };

  export const isEditingMessage = () => editingMessage !== null;
  export const getEditingMessage = () => editingMessage;
</script>

<script lang="ts">
  import { orpc, orpcQuery } from "$lib/client/orpc";
  import {
    MODEL_DETAILS,
    type ReasoningLevel,
    type ModelId,
    GEMINI_FLASH_2_5,
  } from "$lib/common/ai/models";
  import {
    Loader2Icon,
    MicIcon,
    PencilIcon,
    SendIcon,
    Settings2Icon,
    StopCircleIcon,
  } from "@lucide/svelte";
  import { Button } from "../ui/button";
  import KeyboardShortcuts from "../utils/KeyboardShortcuts.svelte";
  import { afterNavigate, goto, onNavigate } from "$app/navigation";
  import { getDbInstance } from "$lib/client/db/index.svelte";
  import { getCurrentChatState } from "$lib/client/state/currentChatState.svelte";
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
  import { VoiceMessageService } from "$lib/client/services/voiceMessageService.svelte";
  import { env } from "$env/dynamic/public";
  import { createMutation } from "@tanstack/svelte-query";
  import { gotoWithSeachParams } from "$lib/utils/navigate";
  import { onMount, untrack } from "svelte";
  import { PremiumWrapper } from "../ui/premium-badge";
  import { verifySession } from "$lib/client/services/turnstile.svelte";
  import OptionsMenu from "./OptionsMenu.svelte";
  import UploadFileButton from "./UploadFileButton.svelte";
  import { FILES_FEATURE_FLAG, getFeatureFlag } from "$lib/common/featureFlags";
  import VoiceInput from "./VoiceInput.svelte";
  import { fade } from "svelte/transition";
  import SsrAnimation from "../utils/SSRAnimation.svelte";
  import ChatInputButton from "./ChatInputButton.svelte";
  import { Maximize2Icon, XIcon } from "@lucide/svelte";
  import { cn } from "$lib/utils";

  interface Props {
    /**
     * @bindable
     */
    textAreaElement?: HTMLTextAreaElement;
    draft: Draft | null;
    isUserSubscribed: boolean;
    draftCount: number;
  }

  let { textAreaElement = $bindable(), draft, isUserSubscribed, draftCount }: Props = $props();

  let textAreaFocused = $state(false);
  let value = $state(page.url.searchParams.get("prompt") ?? "");
  let loading = $state(false);
  let prevDraftId: string | undefined = undefined;
  let navigateOnDraftSafe = true;
  let draftManagerOpen = $state(false);

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
  const autoresize = new TextareaAutosize({
    element: () => textAreaElement,
    input: () => value,
    maxHeight: 24 * 9,
  });

  // Fullscreen/expanded state
  let expanded = $state(false);

  // Show expand control once content reaches ~4 lines (simple heuristic by newlines)
  const showExpandToggle = $derived.by(() => autoresize.textareaHeight > 24 * 5);

  async function onSendMessage() {
    if (loading || !isLastMessageFinished) return;
    loading = true;
    expanded = false;

    const editingMessage = getEditingMessage();
    const chatId = editingMessage?.chatId ?? getCurrentChatState()?.chatId ?? null;
    const parentMessageId =
      editingMessage?.parentMessageId ?? getCurrentChatState()?.lastMessageId ?? null;
    const isNewChat = !chatId;
    const genericErrorMessage = isNewChat ? "Failed to create chat" : "Failed to send message";

    // Cancel any pending draft saves
    debouncedSaveDraft.cancel();

    try {
      const sendRequest = () =>
        safe(
          chatId
            ? orpc.v1.chat.sendMessage({
                chatId,
                model: actualSelectedModel,
                parentMessageId,
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
        void editingMessage?.onSubmitCallback(data.threadId, data.assistantMessageId);
        clearEditingMessage();
        navigateToDraft(undefined);
        value = "";

        if (isNewChat) {
          const chatStream = getDbInstance()?.syncStreams?.streams.chat;
          const messagesStream = getDbInstance()?.syncStreams?.streams.message;
          if (chatStream && messagesStream) {
            try {
              await Promise.all([
                waitForInsert(chatTable, data.chatId, 5000),
                waitForInsert(messageTable, data.userMessageId, 5000),
              ]);
            } catch (err) {
              3;
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

  function focusTextArea() {
    textAreaElement?.focus();
  }

  function toggleExpanded() {
    expanded = !expanded;
    focusTextArea();
  }

  /**
   * FOCUS FUNCTIONS
   */
  onMount(() => {
    // We autofocus when mounting the chat input
    focusTextArea();
  });

  $effect(() => {
    if (!draftManagerOpen) {
      setTimeout(() => {
        focusTextArea();
      }, 1);
    }
  });

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

  /**
   * VOICE MESSAGE STUFF
   */
  const voiceMessageService = new VoiceMessageService();

  async function startRecording() {
    const valid = await voiceMessageService.startRecording();
    if (!valid) {
      toast.error("Failed to access microphone. Please, allow access in your browser settings.");
      return;
    }
  }

  /**
   * DRAFT STUFF
   */

  function navigateToDraft(draftId: string | undefined) {
    gotoWithSeachParams(page.url, {
      keepFocus: true,
      noScroll: true,
      replaceState: false,
      searchParams: {
        draft: draftId,
      },
    });
  }

  const upsertDraftMutation = createMutation(
    orpcQuery.v1.draft.upsert.mutationOptions({
      onSuccess: (draft) => {
        // We set this so the user can keep typing without the draft update losing focus
        prevDraftId = draft.id;
        if (navigateOnDraftSafe) {
          navigateToDraft(draft.id);
        } else {
          navigateOnDraftSafe = true;
        }
      },
      onError: (error) => {
        console.error("Failed to save draft:", error);
      },
    }),
  );

  const deleteDraftMutation = createMutation(
    orpcQuery.v1.draft.delete.mutationOptions({
      onSuccess: () => {
        if (navigateOnDraftSafe) {
          navigateToDraft(undefined);
        } else {
          navigateOnDraftSafe = true;
        }
      },
      onError: (error) => {
        console.error("Failed to delete draft:", error);
      },
    }),
  );

  function saveDraft() {
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

  onNavigate(({ from, to }) => {
    // This means we're going out of the new chat page, or the current chat page, and we want to save the draft
    if (from?.url.pathname !== to?.url.pathname) {
      navigateOnDraftSafe = false;
      debouncedSaveDraft.runScheduledNow();
    }

    clearEditingMessage();
  });

  function resetChat() {
    value = "";
    selectedModel = actualSelectedModel;
    webSearchEnabled = actualWebSearchEnabled;
    reasoningLevel = actualReasoningLevel;
    byokId = actualByokId;
  }

  $effect(() => {
    if (draft?.id !== prevDraftId) {
      navigateOnDraftSafe = false;
      debouncedSaveDraft.runScheduledNow();
      prevDraftId = draft?.id;
      if (!draft) {
        resetChat();
        return;
      }

      value = draft.content;

      if (draft.selectedModel && !MODEL_DETAILS[draft.selectedModel]) {
        console.warn(`Unknown model: ${draft.selectedModel}`);
        return;
      }

      selectedModel = draft.selectedModel ?? untrack(() => actualSelectedModel);
      webSearchEnabled = draft.webSearchEnabled ?? untrack(() => actualWebSearchEnabled);
      reasoningLevel = draft.reasoningLevel ?? untrack(() => actualReasoningLevel);
    }
  });

  /**
   * EDITING MESSAGE STUFF
   */
  $effect(() => {
    console.log("EDIT EFFECT");
    const editingMessage = getEditingMessage();

    if (!editingMessage) {
      navigateOnDraftSafe = false;
      debouncedSaveDraft.runScheduledNow().then(() => {
        navigateToDraft(undefined);
        resetChat();
      });
      return;
    }

    // Setting the message
    debouncedSaveDraft.runScheduledNow().then(() => {
      value = editingMessage.cleanedMessageText;
      selectedModel = editingMessage.model;
      webSearchEnabled = editingMessage.webSearchEnabled;
      reasoningLevel = editingMessage.reasoningLevel;
      modelPickerOpen = false;
      draftManagerOpen = false;
      expanded = false;
    });
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
        focusTextArea();
      },
    },
    {
      key: "m",
      isControl: true,
      callback: () => {
        modelPickerOpen = !modelPickerOpen;
      },
    },
    {
      key: "f",
      isControl: true,
      isShift: true,
      callback: toggleExpanded,
    },
    {
      key: "d",
      isControl: true,
      callback: () => {
        draftManagerOpen = !draftManagerOpen;
      },
    },
    {
      key: "Escape",
      callback: () => {
        if (expanded) {
          expanded = false;
        } else if (textAreaFocused) {
          textAreaElement?.blur();
        }
      },
    },
  ]}
/>

<SsrAnimation>
  <div
    class={cn(
      "mx-auto h-min w-full max-w-screen-md px-2 pb-[calc(env(safe-area-inset-bottom)+var(--spacing)*2)] md:px-2",
      expanded && "h-pwa p-0 md:py-4",
    )}
    transition:fade={{ duration: 150 }}
  >
    {#if expanded}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="pointer-events-auto fixed inset-0 z-[40] bg-black/60"
        transition:fade={{ duration: 150 }}
        onclick={() => (expanded = false)}
      ></div>
    {/if}

    {#if isEditingMessage()}
      <div
        class="bg-accent pointer-events-auto mb-2 flex items-center gap-3 rounded-full py-0.5 pr-2 pl-4"
      >
        <PencilIcon class="size-4" />
        Editing message
        <Button variant="ghost" size="icon" class="ml-auto" onclick={() => clearEditingMessage()}>
          <XIcon />
        </Button>
      </div>
    {/if}

    <div
      class={cn(
        "bg-card group pointer-events-auto relative z-50 flex h-full w-full flex-col gap-3 rounded-lg transition-[border-radius]",
        expanded && "rounded-none md:rounded-lg",
      )}
    >
      {#if voiceMessageService.state === "idle" || voiceMessageService.state === "error"}
        <!-- svelte-ignore a11y_autofocus -->
        <textarea
          id="chat-input"
          autocomplete="off"
          disabled={loading}
          bind:this={textAreaElement}
          bind:value
          oninput={debouncedSaveDraft}
          placeholder="What do you need today?"
          onfocus={() => (textAreaFocused = true)}
          onblur={() => (textAreaFocused = false)}
          class="placeholder:text-muted-foreground w-full flex-grow resize-none overflow-y-auto border-none bg-transparent p-3 pb-0 focus:ring-0 focus:outline-none md:p-4"
        ></textarea>

        {#if showExpandToggle || expanded}
          <div
            transition:fade={{ duration: 150 }}
            class="absolute top-2 right-2 z-10 opacity-80 md:right-4"
          >
            <ChatInputButton onclick={toggleExpanded}>
              {#if expanded}
                <XIcon class="size-3.5 md:size-4" />
              {:else}
                <Maximize2Icon class="size-3.5 md:size-4" />
              {/if}
            </ChatInputButton>
          </div>
        {/if}

        <div class="flex items-center justify-between p-2 pt-0">
          <div class="flex items-center gap-2">
            {#if draftCount > 0}
              <DraftManager bind:open={draftManagerOpen}>
                <ChatInputButton disabled={loading || !browser}>
                  <PencilIcon />
                  {draftCount}
                </ChatInputButton>
              </DraftManager>
            {/if}

            <OptionsMenu
              selectedModel={actualSelectedModel}
              onSelectModel={(newModel) => {
                selectedModel = newModel;
                setLastSelectedModel(newModel);
              }}
              bind:open={modelPickerOpen}
              byokId={actualByokId}
              onSelectByok={(newByokId) => (byokId = newByokId)}
              reasoningLevel={actualReasoningLevel}
              onSelectReasoningLevel={(newReasoningLevel) => (reasoningLevel = newReasoningLevel)}
              webSearch={actualWebSearchEnabled}
              onSelectWebSearch={(newWebSearch) => (webSearchEnabled = newWebSearch)}
            >
              <ChatInputButton>
                <Settings2Icon />
              </ChatInputButton>
            </OptionsMenu>

            {#if getFeatureFlag(FILES_FEATURE_FLAG).enabled}
              <UploadFileButton />
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
        <VoiceInput {voiceMessageService} onTranscript={(transcript) => (value += transcript)} />
      {/if}
    </div>
  </div>
</SsrAnimation>
