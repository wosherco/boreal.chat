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
  import ModelPickerPopover from "../chatInput/ModelPickerPopover.svelte";
  import ReasoningSegment from "./ReasoningSegment.svelte";
  import { orpc } from "$lib/client/orpc";
  import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
  import Markdown from "../markdown/Markdown.svelte";
  import ChatMessageInlineInput from "./ChatMessageInlineInput.svelte";
  import { isFinishedMessageStatus } from "$lib/common";
  import { messageTable } from "$lib/client/db/schema";
  import { waitForInsert } from "$lib/client/hooks/waitForInsert";
  import ThreeDotsStreaming from "$lib/common/loaders/ThreeDotsStreaming.svelte";
  import { m } from '$lib/paraglide/messages.js';

  interface Props {
    message: MessageWithOptionalChainRow;
    messageNode?: MessageTreeNode;
    onChangeThreadId?: (newThreadId: string) => void;
  }

  const { message, messageNode, onChangeThreadId }: Props = $props();

  let editingMessage = $state(false);

  const isUser = $derived(message.role === "user");

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

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(cleanedMessageText);
      toast.success(m.chat_copiedtoclipboard());
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error(m.chat_failedtocopytoclipboard());
    }
  }

  async function regenerateMessage(newModel: ModelId) {
    const result = await orpc.v1.chat.regenerateMessage({
      model: newModel,
      messageId: message.id,
    });

    try {
      await waitForInsert(messageTable, result.messageId, 5000);
    } catch (e) {
      console.error("Waiting for message sync failed", e);
    }

    onChangeThreadId?.(result.threadId);
  }

  async function onSubmitEdit(newThreadId: string, newMessageId: string) {
    try {
      await waitForInsert(messageTable, newMessageId, 5000);
    } catch (e) {
      console.error("Waiting for message sync failed", e);
    }

    onChangeThreadId?.(newThreadId);

    editingMessage = false;
  }

  function onCancelEdit() {
    editingMessage = false;
  }
</script>

<div class="group min-w-0 flex-1 break-words">
  {#if editingMessage && isUser}
    <ChatMessageInlineInput
      defaultValue={cleanedMessageText}
      onSubmit={onSubmitEdit}
      parentMessageId={message.parentMessageId}
      chatId={message.chatId}
      onCancel={onCancelEdit}
      model={message.model}
    />
  {:else}
    <div
      class={cn(
        isUser && "bg-muted border-input w-fit rounded-lg border px-4 py-2 shadow-sm",
        "mr-auto max-w-full",
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
          <ReasoningSegment reasoning={segment.content ?? ""} isReasoning={segment.streaming} />
        {:else if segment.kind === "tool_call"}
          {m.chat_todotoolcall()}
        {:else if segment.kind === "tool_result"}
          {m.chat_todotoolresult()}
        {/if}
      {/each}
    </div>

    {#if message.status === "error"}
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>{m.error_error()}</AlertTitle>
        <AlertDescription>
          <p>{message.error ?? m.error_unknownerror1()}</p>
          <p>{m.error_tryagainlater2()}</p>
        </AlertDescription>
      </Alert>
    {/if}

    {#if message.status === "processing"}
      <div class="pt-4 pl-4">
        <span class="sr-only">{m.chat_generating()}</span>
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
            <TooltipContent>{m.tooltips_copy()}</TooltipContent>
          </Tooltip>

          {#if isUser}
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="small-icon"
                  onclick={() => (editingMessage = true)}
                  disabled={!messageNode}
                >
                  <EditIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{m.tooltips_edit()}</TooltipContent>
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
              <TooltipContent
                >{m.tooltips_regenerate({ model: MODEL_DETAILS[message.model].displayName })}</TooltipContent
              >
            </Tooltip>
          {/if}

          {#if otherVersions.length >= 1}
            <div class="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="small-icon" onclick={previousThread}>
                    <ChevronLeftIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{m.general_previous()}</TooltipContent>
              </Tooltip>

              <span class="text-muted-foreground text-xs font-mono">
                {message.version}/{otherVersions.length + 1}
              </span>

              <Tooltip>
                <TooltipTrigger>
                  <Button variant="ghost" size="small-icon" onclick={nextThread}>
                    <ChevronRightIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{m.general_next()}</TooltipContent>
              </Tooltip>
            </div>
          {/if}
        </div>
      </TooltipProvider>
    {/if}
  {/if}
</div>
