<script lang="ts">
  import { Button } from "../ui/button";
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
  import { EllipsisVerticalIcon, MessageSquareIcon, PinIcon, PencilIcon, TrashIcon } from "@lucide/svelte";
  import { cn } from "$lib/utils";
  import { page } from "$app/state";
  import type { Chat } from "$lib/common/sharedTypes";
  import { orpcQuery } from "$lib/client/orpc";
  import { createMutation } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import SheetClosableOnlyOnPhone from "../utils/SheetClosableOnlyOnPhone.svelte";
  import { hold } from "$lib/actions";
  import EditChatTitleDialog from "./EditChatTitleDialog.svelte";
  import DeleteChatAlertDialog from "./DeleteChatAlertDialog.svelte";
  import { m } from '$lib/paraglide/messages.js';

  interface Props {
    chat: Chat;
    isPhone?: boolean;
  }

  let { chat, isPhone = false }: Props = $props();

  const isActive = $derived(page.url.pathname === `/chat/${chat.id}`);

  let dropdownOpen = $state(false);
  let editChatTitleDialogOpen = $state(false);
  let deleteChatModalOpen = $state(false);

  const pinToggleMutation = createMutation(
    orpcQuery.v1.chat.pinToggle.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.pinned ? m.chat_pinned() : m.chat_unpinned());
      },
      onError: (error) => {
        console.error("Error toggling pin:", error);
        toast.error("Failed to toggle pin");
      },
    }),
  );
</script>

<EditChatTitleDialog bind:open={editChatTitleDialogOpen} {chat} />
<DeleteChatAlertDialog bind:open={deleteChatModalOpen} {chat} />

<SheetClosableOnlyOnPhone
  {isPhone}
  class={cn(
    "group flex w-full items-center gap-2 rounded-lg px-2 py-1 text-start transition-colors hover:bg-accent",
    isActive && "bg-accent",
  )}
>
  <Button
    variant="ghost"
    class={cn("min-w-0 flex-1 justify-start gap-2 px-2", isActive && "bg-accent")}
    href={`/chat/${chat.id}`}
    {@attach hold({
      onHold: () => {
        dropdownOpen = true;
      },
      duration: 500,
    })}
  >
    <MessageSquareIcon class="text-muted-foreground" />
    <span class="min-w-0 flex-1 truncate text-sm font-medium">{chat.title ?? m.chat_notitle()}</span>
    <DropdownMenu bind:open={dropdownOpen}>
      <DropdownMenuTrigger>
        <button
          class={cn(
            "hidden shrink-0 group-hover:flex group-hover:rounded-l-none",
            isActive && "flex",
          )}
        >
          <EllipsisVerticalIcon />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onclick={() =>
            $pinToggleMutation.mutate({
              chatId: chat.id,
              pinned: !chat.pinned,
            })}
          disabled={$pinToggleMutation.isPending}
        >
          <PinIcon />
          {chat.pinned ? m.chat_unpin() : m.chat_pin()}
        </DropdownMenuItem>
        <DropdownMenuItem onclick={() => (editChatTitleDialogOpen = true)}>
          <PencilIcon />
          {m.chat_rename()}
        </DropdownMenuItem>
        <DropdownMenuItem onclick={() => (deleteChatModalOpen = true)}>
          <TrashIcon />
          {m.chat_delete()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </Button>
</SheetClosableOnlyOnPhone>
