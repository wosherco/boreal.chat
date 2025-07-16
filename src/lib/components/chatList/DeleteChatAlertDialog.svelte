<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { orpcQuery } from "$lib/client/orpc";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { Loader2 } from "@lucide/svelte";
  import { createMutation } from "@tanstack/svelte-query";
  import type { Snippet } from "svelte";
  import { toast } from "svelte-sonner";

  interface Props {
    chatId: string;
    children?: Snippet;
    /**
     * @bindable
     */
    open?: boolean;
  }

  let { chatId, children: trigger, open = $bindable(false) }: Props = $props();

  const deleteMutation = createMutation(
    orpcQuery.v1.chat.deleteChat.mutationOptions({
      onSuccess: () => {
        toast.success("Chat moved to deleted folder");
        open = false;

        if (page.params.chatId === chatId) {
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
      <AlertDialog.Title>Delete this chat?</AlertDialog.Title>
      <AlertDialog.Description>
        This chat will be moved to the deleted folder. You can restore it anytime within 14 days,
        after which it will be permanently removed.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={() => $deleteMutation.mutate({ chatId })}
        disabled={$deleteMutation.isPending}
      >
        {#if $deleteMutation.isPending}
          <Loader2 class="animate-spin" />
          Deleting...
        {:else}
          Delete
        {/if}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
