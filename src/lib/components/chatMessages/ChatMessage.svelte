<script lang="ts">
  import type { MessageWithOptionalChainRow, SegmentJson } from "$lib/common/sharedTypes";
  import { cn } from "$lib/utils";
  import type { MessageTreeNode } from "$lib/utils/tree";
  import {
    AlertCircleIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CopyIcon,
    EditIcon,
    RotateCcwIcon,
  } from "@lucide/svelte";
  import { Button } from "../ui/button";
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
  import { toast } from "svelte-sonner";
  import { MODEL_DETAILS, type ModelId } from "$lib/common/ai/models";
  import ModelPickerPopover from "../chatInput/ModelPickerPopover/ModelPickerPopover.svelte";
  import ReasoningSegment from "./ReasoningSegment.svelte";
  import { orpc } from "$lib/client/orpc";
  import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
  import Markdown from "../markdown/Markdown.svelte";
  import { isFinishedMessageStatus } from "$lib/common";
  import { messageTable } from "$lib/client/db/schema";
  import { waitForInsert } from "$lib/client/hooks/waitForInsert";
  import ThreeDotsStreaming from "$lib/common/loaders/ThreeDotsStreaming.svelte";
  import { safe } from "@orpc/client";
  import { verifySession } from "$lib/client/services/turnstile.svelte";
  import { setEditingMessage, getEditingMessage } from "../chatInput/ChatMessageInput.svelte";

  interface Props {
    message: MessageWithOptionalChainRow;
    messageNode?: MessageTreeNode;
    onChangeThreadId?: (newThreadId: string) => void;
  }

  const { message, messageNode, onChangeThreadId }: Props = $props();

  const isUser = $derived(message.role === "user");

  const isBeingEdited = $derived(getEditingMessage()?.messageId === message.id);

  const otherVersions = $derived(
    messageNode?.parent?.children
      ?.filter((child) => child.value.id !== message.id)
      ?.sort((a, b) => a.value.version - b.value.version) ?? [],
  );

  function nextThread() {
    const nextVersion = message.version + 1;
    const nextThread = otherVersions.find((child) => child.value.version === nextVersion);

    if (nextThread) {
      onChangeThreadId?.(nextThread.value.threadId);
    }
  }

  function previousThread() {
    const previousVersion = message.version - 1;
    const previousThread = otherVersions.find((child) => child.value.version === previousVersion);

    if (previousThread) {
      onChangeThreadId?.(previousThread.value.threadId);
    }
  }

  const cleanedSegments = $derived.by(() => {
    const { segments: dbSegments } = message;
    let cleanedSegments: SegmentJson[] = [];

    if (dbSegments) {
      let cacheSegment: SegmentJson | undefined;

      for (const segment of dbSegments) {
        switch (segment.kind) {
          case "reasoning":
          case "text":
            {
              if (cacheSegment) {
                if (cacheSegment.kind === segment.kind) {
                  if (!cacheSegment.content) {
                    cacheSegment.content = "";
                  }

                  if (segment.content) {
                    cacheSegment.content += segment.content;
                  }
                } else {
                  cleanedSegments.push(cacheSegment);
                  cacheSegment = {
                    ...segment,
                  };
                }
              } else {
                cacheSegment = {
                  ...segment,
                };
              }
            }
            continue;
          case "tool_call":
          case "tool_result":
            {
              if (cacheSegment) {
                cleanedSegments.push(cacheSegment);
                cacheSegment = undefined;
              }

              cleanedSegments.push({
                ...segment,
              });
            }
            continue;
        }
      }

      if (cacheSegment) {
        cleanedSegments.push(cacheSegment);
      }
    }

    return cleanedSegments;
  });

  const cleanedMessageText = $derived(
    cleanedSegments
      .filter((segment) => segment.kind === "text")
      .map((segment) => segment.content)
      .join("") || "",
  );

  function copyToClipboard() {
    navigator.clipboard.writeText(cleanedMessageText);
    toast.success("Copied message to clipboard!");
  }

  async function regenerateMessage(newModel: ModelId) {
    const sendRequest = () =>
      safe(
        orpc.v1.chat.regenerateMessage({
          chatId: message.chatId,
          model: newModel,
          messageId: message.id,
        }),
      );

    const onSuccess = async (messageId: string, threadId: string) => {
      try {
        await waitForInsert(messageTable, messageId, 5000);
      } catch (e) {
        console.error("Waiting for message sync failed", e);
      }

      onChangeThreadId?.(threadId);
    };

    const { error, isDefined, isSuccess, data } = await sendRequest();

    if (isSuccess) {
      return onSuccess(data.messageId, data.threadId);
    }

    if (isDefined && error.code === "SESSION_NOT_VERIFIED") {
      const verified = await verifySession();

      if (!verified) {
        toast.error("Failed to verify session");
        return;
      }

      const retryRes = await sendRequest();
      const { error, isSuccess } = retryRes;

      if (isSuccess) {
        return onSuccess(retryRes.data.messageId, retryRes.data.threadId);
      }

      toast.error("message" in error ? error.message : "Failed to regenerate message");
    } else {
      toast.error("message" in error ? error.message : "Failed to regenerate message");
    }
  }

  async function onSubmitEdit(newThreadId: string, newMessageId: string) {
    try {
      await waitForInsert(messageTable, newMessageId, 5000);
    } catch (e) {
      console.error("Waiting for message sync failed", e);
    }

    onChangeThreadId?.(newThreadId);
  }
</script>

<div class="group min-w-0 flex-1 break-words">
  <div
    class={cn(
      isUser && "bg-muted border-input w-fit rounded-lg border px-4 py-2 transition-shadow",
      "mr-auto max-w-full",
      isBeingEdited && "editing-shadow",
    )}
  >
    {#each cleanedSegments as segment (segment.ordinal)}
      {#if segment.kind === "text"}
        {#if isUser}
          <div class="whitespace-pre-wrap">{segment.content ?? ""}</div>
        {:else}
          <Markdown content={segment.content ?? ""} />
        {/if}
      {:else if segment.kind === "reasoning"}
        <ReasoningSegment reasoning={segment.content ?? ""} streaming={segment.streaming} />
      {:else if segment.kind === "tool_call"}
        TODO: Tool call
      {:else if segment.kind === "tool_result"}
        TODO: Tool result
      {/if}
    {/each}
  </div>

  {#if message.status === "error"}
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        <p>{message.error ?? "Unknown error"}</p>
        <p>Please try again later by regenerating the message.</p>
      </AlertDescription>
    </Alert>
  {/if}

  {#if message.status === "processing"}
    <div class="pt-4 pl-4">
      <span class="sr-only">Generating...</span>
      <ThreeDotsStreaming />
    </div>
  {/if}

  {#if isFinishedMessageStatus(message.status)}
    <TooltipProvider>
      <div class="mr-auto flex w-fit flex-row items-center gap-1 pt-2">
        <Tooltip>
          <TooltipTrigger>
            <Button variant="ghost" size="small-icon" onclick={copyToClipboard}>
              <CopyIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>

        {#if isUser}
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="small-icon"
                onclick={() =>
                  setEditingMessage({
                    messageId: message.id,
                    cleanedMessageText: cleanedMessageText,
                    parentMessageId: message.parentMessageId,
                    chatId: message.chatId,
                    model: message.model,
                    reasoningLevel: message.reasoningLevel,
                    webSearchEnabled: message.webSearchEnabled,
                    onSubmitCallback: onSubmitEdit,
                  })}
                disabled={!messageNode}
              >
                <EditIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        {/if}

        {#if !isUser}
          <Tooltip>
            <TooltipTrigger>
              <ModelPickerPopover selectedModel={message.model} onSelect={regenerateMessage}>
                <Button variant="ghost" size="sm">
                  <RotateCcwIcon />
                  <ChevronDownIcon />
                </Button>
              </ModelPickerPopover>
            </TooltipTrigger>
            <TooltipContent>Regenerate ({MODEL_DETAILS[message.model].displayName})</TooltipContent>
          </Tooltip>
        {/if}

        {#if otherVersions.length >= 1}
          <Button
            variant="ghost"
            size="small-icon"
            onclick={previousThread}
            disabled={message.version === 1}
          >
            <ChevronLeftIcon />
          </Button>
          <p>{message.version}/{otherVersions.length + 1}</p>
          <Button
            variant="ghost"
            size="small-icon"
            onclick={nextThread}
            disabled={message.version === otherVersions.length + 1}
          >
            <ChevronRightIcon />
          </Button>
        {/if}
      </div>
    </TooltipProvider>
  {/if}
</div>

<style>
  .editing-shadow {
    box-shadow: 0 0 12px 0px color-mix(in oklab, var(--foreground) 70%, transparent);
  }
</style>
