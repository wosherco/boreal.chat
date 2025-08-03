<script lang="ts">
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import {
    ArchiveRestoreIcon,
    TrashIcon,
    MessageSquareIcon,
    ArrowLeftIcon,
    Loader2Icon,
  } from "@lucide/svelte";
  import { orpcQuery } from "$lib/client/orpc";
  import { createMutation } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";
  import { groupByDate, currentDate } from "$lib/utils/dates.svelte";
  import { createArchivedChats } from "$lib/client/hooks/useArchivedChats.svelte";
  import type { Chat } from "$lib/common/sharedTypes";

  const { data }: { data: PageData } = $props();

  const archivedChats = createArchivedChats(() => data.archivedChats ?? null);
  const sortedChats = $derived(groupByDate(archivedChats.data ?? [], currentDate()));

  const unarchiveMutation = createMutation(
    orpcQuery.v1.chat.unarchiveChat.mutationOptions({
      onSuccess: () => {
        toast.success("Chat unarchived");
      },
      onError: () => {
        toast.error("Failed to unarchive chat");
      },
    }),
  );

  const deleteMutation = createMutation(
    orpcQuery.v1.chat.deleteChat.mutationOptions({
      onSuccess: () => {
        toast.success("Chat deleted");
      },
      onError: () => {
        toast.error("Failed to delete chat");
      },
    }),
  );

  function handleUnarchive(chatId: string) {
    $unarchiveMutation.mutate({ chatId });
  }

  function handleDelete(chatId: string) {
    if (
      confirm(
        "Are you sure you want to delete this chat? It will be permanently deleted in 14 days.",
      )
    ) {
      $deleteMutation.mutate({ chatId });
    }
  }
</script>

<svelte:head>
  <title>Archived Chats | boreal.chat</title>
</svelte:head>

{#snippet chatSection(title: string, chats: Chat[])}
  <div>
    <h2 class="text-muted-foreground mb-3 text-sm font-medium">{title}</h2>
    <div class="grid gap-3">
      {#each chats as chat (chat.id)}
        <div class="bg-card hover:bg-accent/50 rounded-lg border p-4 transition-colors">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <h3 class="truncate font-medium">
                {chat.title || "Untitled Chat"}
              </h3>
              <div class="mt-1 flex items-center gap-2">
                <Badge variant="secondary" class="text-xs">Archived</Badge>
                <span class="text-muted-foreground text-xs">
                  {chat.updatedAt.toLocaleDateString()}
                </span>
              </div>
            </div>
            <div class="flex gap-2">
              <Button variant="outline" size="sm" onclick={() => goto(`/chat/${chat.id}`)}>
                <MessageSquareIcon class="mr-2 size-4" />
                Visit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onclick={() => handleUnarchive(chat.id)}
                disabled={$unarchiveMutation.isPending}
              >
                <ArchiveRestoreIcon class="mr-2 size-4" />
                Unarchive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onclick={() => handleDelete(chat.id)}
                disabled={$deleteMutation.isPending}
                class="text-destructive hover:text-destructive"
              >
                <TrashIcon class="mr-2 size-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/snippet}

{#if archivedChats.loading || !archivedChats.data}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="h-10 w-10 animate-spin" />
  </div>
{:else}
  <div class="h-full overflow-y-auto p-6">
    <div class="mx-auto max-w-4xl">
      <!-- Header -->
      <div class="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onclick={() => goto("/")}>
          <ArrowLeftIcon class="size-4" />
        </Button>
        <div>
          <h1 class="text-2xl font-bold">Archived Chats</h1>
          <p class="text-muted-foreground text-sm">
            {archivedChats.data.length} archived {archivedChats.data.length === 1
              ? "chat"
              : "chats"}
          </p>
        </div>
      </div>

      <!-- Content -->
      {#if archivedChats.data.length === 0}
        <div
          class="text-muted-foreground flex flex-col items-center justify-center py-16 text-center"
        >
          <MessageSquareIcon class="mb-4 h-12 w-12" />
          <h3 class="mb-2 text-lg font-medium">No archived chats</h3>
          <p class="text-sm">
            When you archive chats, they'll appear here. You can unarchive them anytime.
          </p>
        </div>
      {:else}
        <div class="space-y-6">
          {#if sortedChats.today.length > 0}
            {@render chatSection("Today", sortedChats.today)}
          {/if}
          {#if sortedChats.yesterday.length > 0}
            {@render chatSection("Yesterday", sortedChats.yesterday)}
          {/if}
          {#if sortedChats.thisWeek.length > 0}
            {@render chatSection("This Week", sortedChats.thisWeek)}
          {/if}
          {#if sortedChats.others.length > 0}
            {@render chatSection("Older", sortedChats.others)}
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}
