<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { orpcQuery } from "$lib/client/orpc";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { Loader2 } from "@lucide/svelte";
  import { createMutation } from "@tanstack/svelte-query";
  import type { Snippet } from "svelte";
  import { toast } from "svelte-sonner";
  import type { Chat } from "$lib/common/sharedTypes";
  import { m } from '$lib/paraglide/messages.js';

  interface Props {
    chat: Chat;
    children?: Snippet;
    /**
     * @bindable
     */
    open?: boolean;
  }

  let { chat, children: trigger, open = $bindable(false) }: Props = $props();

  const deleteMutation = createMutation(
    orpcQuery.v1.chat.deleteChat.mutationOptions({
      onSuccess: () => {
        toast.success("Chat deleted");
        open = false;

        if (page.params.chatId === chat.id) {
          goto("/");
        }
      },
    }),
  );
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Trigger>
    {@render trigger?.()}
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>{m.chat_deletechatconfirm()}</AlertDialog.Title>
      <AlertDialog.Description>
        {m.chat_thisactioncannotbeundone()}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>{m.chat_cancel()}</AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={() => $deleteMutation.mutate({ chatId: chat.id })}
        disabled={$deleteMutation.isPending}
      >
        {#if $deleteMutation.isPending}
          <Loader2 class="animate-spin" />
          {m.general_processing()}...
        {:else}
          {m.chat_deleteaction()}
        {/if}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
