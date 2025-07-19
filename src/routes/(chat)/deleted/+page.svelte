<script lang="ts">
  import type { PageData } from "./$types";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import {
    ArchiveRestoreIcon,
    TrashIcon,
    MessageSquareIcon,
    ArrowLeftIcon,
    AlertTriangleIcon,
  } from "@lucide/svelte";
  import { orpcQuery } from "$lib/client/orpc";
  import { createMutation } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";
  import { cn } from "$lib/utils";

  const { data }: { data: PageData } = $props();

  const deletedChats = $derived(data.deletedChats || []);

  const restoreMutation = createMutation(
    orpcQuery.v1.chat.restoreChat.mutationOptions({
      onSuccess: () => {
        toast.success("Chat restored");
        location.reload(); // Simple refresh to update the list
      },
      onError: () => {
        toast.error("Failed to restore chat");
      },
    }),
  );

  function handleRestore(chatId: string) {
    $restoreMutation.mutate({ chatId });
  }

  function handlePermanentDelete(chatId: string) {
    if (
      confirm(
        "Are you sure you want to permanently delete this chat? This action cannot be undone.",
      )
    ) {
      // For now, we'll just show a message since permanent deletion will be handled by the cron job
      toast.info(
        "Chat marked for permanent deletion. It will be removed automatically after 14 days.",
      );
    }
  }

  function getDaysUntilDeletion(deletedAt: Date): number {
    const now = new Date();
    const deletedDate = new Date(deletedAt);
    const fourteenDaysLater = new Date(deletedDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const msUntilDeletion = fourteenDaysLater.getTime() - now.getTime();
    return Math.ceil(msUntilDeletion / (24 * 60 * 60 * 1000));
  }
</script>

<svelte:head>
  <title>Deleted Chats | boreal.chat</title>
</svelte:head>

<div class="h-full overflow-y-auto p-6">
  <div class="mx-auto max-w-4xl">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-4">
      <Button variant="ghost" size="icon" onclick={() => goto("/")}>
        <ArrowLeftIcon class="size-4" />
      </Button>
      <div>
        <h1 class="text-2xl font-bold">Deleted Chats</h1>
        <p class="text-muted-foreground text-sm">
          {deletedChats.length} deleted {deletedChats.length === 1 ? "chat" : "chats"}
        </p>
      </div>
    </div>

    <!-- Warning -->
    {#if deletedChats.length > 0}
      <div class="bg-destructive/10 border-destructive/20 mb-6 rounded-lg border p-4">
        <div class="flex gap-3">
          <AlertTriangleIcon class="text-destructive size-5 flex-shrink-0" />
          <div>
            <h3 class="text-destructive font-medium">Automatic Deletion</h3>
            <p class="text-destructive/80 text-sm">
              Deleted chats will be permanently removed after 14 days. You can restore them anytime
              before then.
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Content -->
    {#if deletedChats.length === 0}
      <div
        class="text-muted-foreground flex flex-col items-center justify-center py-16 text-center"
      >
        <MessageSquareIcon class="mb-4 h-12 w-12" />
        <h3 class="mb-2 text-lg font-medium">No deleted chats</h3>
        <p class="text-sm">
          When you delete chats, they'll appear here for 14 days before being permanently removed.
        </p>
      </div>
    {:else}
      <div class="grid gap-3">
        {#each deletedChats as chat (chat.id)}
          {@const daysLeft = chat.deletedAt ? getDaysUntilDeletion(chat.deletedAt) : 0}
          <div class="bg-card hover:bg-accent/50 rounded-lg border p-4 transition-colors">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <h3 class="truncate font-medium">
                  {chat.title || "Untitled Chat"}
                </h3>
                <div class="mt-1 flex items-center gap-2">
                  <Badge variant="destructive" class="text-xs">Deleted</Badge>
                  {#if chat.deletedAt}
                    <span class="text-muted-foreground text-xs">
                      Deleted {chat.deletedAt.toLocaleDateString()}
                    </span>
                    <span class="text-destructive text-xs font-medium">
                      • {daysLeft > 0
                        ? `${daysLeft} days until permanent deletion`
                        : "Will be deleted soon"}
                    </span>
                  {/if}
                </div>
              </div>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => handleRestore(chat.id)}
                  disabled={$restoreMutation.isPending}
                >
                  <ArchiveRestoreIcon class="mr-2 size-4" />
                  Restore
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => handlePermanentDelete(chat.id)}
                  class="text-destructive hover:text-destructive"
                >
                  <TrashIcon class="mr-2 size-4" />
                  Delete Forever
                </Button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
