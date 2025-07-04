<script lang="ts">
  import { cn } from "$lib/utils";
  import { EllipsisVerticalIcon, MessageSquareIcon, PencilIcon, TrashIcon } from "@lucide/svelte";
  import { Button } from "../ui/button";
  import SheetClosableOnlyOnPhone from "../utils/SheetClosableOnlyOnPhone.svelte";
  import type { Chat } from "$lib/common/sharedTypes";
  import { page } from "$app/state";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "../ui/dropdown-menu";
  import { hold } from "$lib/actions/hold";
  import EditChatTitleDialog from "./EditChatTitleDialog.svelte";
  import DeleteChatAlertDialog from "./DeleteChatAlertDialog.svelte";

  interface Props {
    chat: Chat;
    isPhone: boolean;
  }

  const { chat, isPhone }: Props = $props();

  let dropdownOpen = $state(false);
  let editChatTitleDialogOpen = $state(false);
  let deleteChatModalOpen = $state(false);

  const isActive = $derived(page.params.chatId === chat.id || dropdownOpen);
</script>

<EditChatTitleDialog
  chatId={chat.id}
  currentTitle={chat.title ?? ""}
  bind:open={editChatTitleDialogOpen}
/>

<DeleteChatAlertDialog chatId={chat.id} bind:open={deleteChatModalOpen} />

<SheetClosableOnlyOnPhone
  {isPhone}
  class="group flex w-full flex-row items-center justify-start text-start"
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
    <span class="min-w-0 flex-1 truncate text-sm font-medium">{chat.title ?? "No title"}</span>
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
        <DropdownMenuItem onclick={() => (editChatTitleDialogOpen = true)}>
          <PencilIcon />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onclick={() => (deleteChatModalOpen = true)}>
          <TrashIcon />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </Button>
</SheetClosableOnlyOnPhone>
