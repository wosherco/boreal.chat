<script lang="ts">
  import { orpc } from "$lib/client/orpc";
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
  import { onMount } from "svelte";

  interface Props {
    onDraftSelect?: (draft: Draft) => void;
    children: any;
  }

  let { onDraftSelect, children }: Props = $props();

  let open = $state(false);
  
  const draftsStore = useDrafts();
  const drafts = $derived(draftsStore.data || []);
  const loading = $derived(draftsStore.loading);

  async function deleteDraft(draftId: string) {
    try {
      await orpc.v1.draft.delete({ id: draftId });
      toast.success("Draft deleted");
    } catch (error) {
      console.error("Failed to delete draft:", error);
      toast.error("Failed to delete draft");
    }
  }

  async function deleteAllDrafts() {
    try {
      await orpc.v1.draft.deleteAll();
      toast.success("All drafts deleted");
    } catch (error) {
      console.error("Failed to delete all drafts:", error);
      toast.error("Failed to delete all drafts");
    }
  }

  function handleDraftSelect(draft: Draft) {
    onDraftSelect?.(draft);
    open = false;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function truncateContent(content: string, maxLength = 100) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  }


</script>

<Dialog bind:open>
  <DialogTrigger asChild let:builder>
    <div use:builder.action {...builder}>
      {@render children()}
    </div>
  </DialogTrigger>
  <DialogContent class="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
    <DialogHeader>
      <DialogTitle>Draft Manager</DialogTitle>
      <DialogDescription>
        Manage your saved drafts. Click on a draft to load it.
      </DialogDescription>
    </DialogHeader>

    <div class="flex justify-between items-center py-2">
      <span class="text-sm text-muted-foreground">
        {drafts.length} draft{drafts.length !== 1 ? "s" : ""}
      </span>
      {#if drafts.length > 0}
        <Button variant="destructive" size="sm" onclick={deleteAllDrafts}>
          Delete All
        </Button>
      {/if}
    </div>

    <div class="flex-1 overflow-y-auto space-y-2">
      {#if loading}
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      {:else if drafts.length === 0}
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <FileTextIcon class="h-12 w-12 text-muted-foreground mb-2" />
          <p class="text-muted-foreground">No drafts found</p>
          <p class="text-sm text-muted-foreground">
            Start typing to create your first draft
          </p>
        </div>
      {:else}
        {#each drafts as draft (draft.id)}
          <div
            class="border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
            onclick={() => handleDraftSelect(draft)}
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <p class="text-sm text-muted-foreground mb-2">
                  {truncateContent(draft.content)}
                </p>
                <div class="flex items-center gap-4 text-xs text-muted-foreground">
                  <div class="flex items-center gap-1">
                    <CalendarIcon class="h-3 w-3" />
                    {formatDate(draft.updatedAt)}
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
                class="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                onclick={(e) => {
                  e.stopPropagation();
                  deleteDraft(draft.id);
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