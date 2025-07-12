<script lang="ts">
  import { superForm } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { z } from "zod";
  import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
  import { Form } from "../ui/form";
  import { Input } from "../ui/input";
  import { orpcQuery } from "$lib/client/orpc";
  import { createMutation } from "@tanstack/svelte-query";
  import { toast } from "svelte-sonner";
  import type { Chat } from "$lib/common/sharedTypes";
  import { m } from '$lib/paraglide/messages.js';

  interface Props {
    /**
     * @bindable
     */
    open?: boolean;
    chat: Chat;
    trigger?: () => void;
  }

  let { open = $bindable(false), chat, trigger }: Props = $props();

  const schema = z.object({
    title: z.string().min(1).max(100),
  });

  const form = superForm(
    { title: chat.title ?? "" },
    {
      validators: zodClient(schema),
      onUpdate: ({ form }) => {
        if (form.valid) {
          $editChatTitleMutation.mutate({
            chatId: chat.id,
            title: $formData.title,
          });
        }
      },
    },
  );

  const { form: formData, enhance } = form;

  const editChatTitleMutation = createMutation(
    orpcQuery.v1.chat.editTitle.mutationOptions({
      onSuccess: () => {
        toast.success("Chat title updated");
        open = false;
      },
      onError: (error) => {
        console.error("Error updating chat title:", error);
        toast.error("Failed to update chat title");
      },
    }),
  );
</script>

<Dialog bind:open>
  <DialogTrigger>
    {@render trigger?.()}
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{m.chat_editchattitle()}</DialogTitle>
    </DialogHeader>

    <form method="POST" class="space-y-6" use:enhance>
      <Form.Field {form} name="title">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>{m.chat_title()}</Form.Label>
            <Input {...props} bind:value={$formData.title} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <DialogFooter>
        <Form.Button>{m.chat_submit()}</Form.Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
