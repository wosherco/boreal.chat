<script lang="ts">
  import { orpcQuery } from "$lib/client/orpc";
  import { Button } from "../ui/button";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "../ui/dialog";
  import { TrashIcon, FileTextIcon, CalendarIcon } from "@lucide/svelte";
  import { toast } from "svelte-sonner";
  import type { Draft } from "$lib/common/sharedTypes";
  import { useDrafts } from "$lib/client/hooks/useDrafts.svelte";
  import { createMutation } from "@tanstack/svelte-query";
  import { formatDateCompact } from "$lib/utils/date";
  import { truncateText, formatCount } from "$lib/utils/text";
  import type { Snippet } from "svelte";
  import { gotoWithSeachParams } from "$lib/utils/navigate";
  import { page } from "$app/state";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  let open = $state(false);

  const draftsStore = useDrafts();
  const drafts = $derived($draftsStore?.data ?? []);
  const loading = $derived($draftsStore?.loading ?? true);

  const deleteDraftMutation = createMutation(
    orpcQuery.v1.draft.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Draft deleted");
      },
      onError: (error) => {
        toast.error("Failed to delete draft");
        console.error("Failed to delete draft:", error);
      },
    }),
  );

  const deleteAllDraftsMutation = createMutation(
    orpcQuery.v1.draft.deleteAll.mutationOptions({
      onSuccess: () => {
        toast.success("All drafts deleted");
      },
      onError: (error) => {
        toast.error("Failed to delete all drafts");
        console.error("Failed to delete all drafts:", error);
      },
    }),
  );

  function handleDraftSelect(draft: Draft) {
    gotoWithSeachParams(page.url, {
      searchParams: {
        draft: draft.id,
      },
    });
    open = false;
  }
</script>

<Dialog bind:open>
  <DialogTrigger>
    {@render children()}
  </DialogTrigger>
  <DialogContent class="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
    <DialogHeader>
      <DialogTitle>Draft Manager</DialogTitle>
      <DialogDescription>Manage your saved drafts. Click on a draft to load it.</DialogDescription>
    </DialogHeader>

    <div class="flex items-center justify-between py-2">
      <span class="text-muted-foreground text-sm">
        {formatCount(drafts.length, "draft")}
      </span>
      {#if drafts.length > 0}
        <Button variant="destructive" size="sm" onclick={() => $deleteAllDraftsMutation.mutate({})}>
          Delete All
        </Button>
      {/if}
    </div>

    <div class="flex-1 space-y-2 overflow-y-auto">
      {#if loading}
        <div class="flex items-center justify-center py-8">
          <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      {:else if drafts.length === 0}
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <FileTextIcon class="text-muted-foreground mb-2 h-12 w-12" />
          <p class="text-muted-foreground">No drafts found</p>
          <p class="text-muted-foreground text-sm">Start typing to create your first draft</p>
        </div>
      {:else}
        {#each drafts as draft (draft.id)}
          <div
            class="hover:bg-muted/50 group cursor-pointer rounded-lg border p-3 transition-colors"
            onclick={() => handleDraftSelect(draft)}
            aria-label={`Load draft ${draft.id}`}
            role="button"
            tabindex="0"
            onkeydown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleDraftSelect(draft);
              }
            }}
          >
            <div class="flex items-start justify-between">
              <div class="min-w-0 flex-1">
                <p class="text-muted-foreground mb-2 text-sm">
                  {truncateText(draft.content)}
                </p>
                <div class="text-muted-foreground flex items-center gap-4 text-xs">
                  <div class="flex items-center gap-1">
                    <CalendarIcon class="h-3 w-3" />
                    {formatDateCompact(draft.updatedAt.toISOString())}
                  </div>
                  <span class="capitalize">{draft.selectedModel}</span>
                  {#if draft.webSearchEnabled}
                    <span class="text-blue-600">Web Search</span>
                  {/if}
                  {#if draft.reasoningLevel !== "none"}
                    <span class="text-purple-600 capitalize">{draft.reasoningLevel} Reasoning</span>
                  {/if}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="ml-2 opacity-0 transition-opacity group-hover:opacity-100"
                onclick={(e) => {
                  e.stopPropagation();
                  $deleteDraftMutation.mutate({ id: draft.id });
                }}
              >
                <TrashIcon class="h-4 w-4" />
              </Button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </DialogContent>
</Dialog>
