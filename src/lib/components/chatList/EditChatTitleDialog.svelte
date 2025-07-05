<script lang="ts" module>
  import { z } from "zod";
  import { chatTitleSchema } from "$lib/common/validators/chat";

  const formSchema = z.object({
    title: chatTitleSchema,
  });
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "../ui/dialog";

  interface Props {
    chatId: string;
    currentTitle: string;
    children?: Snippet;
    /**
     * @bindable
     */
    open?: boolean;
  }

  let { children: trigger, chatId, currentTitle, open = $bindable(false) }: Props = $props();

  import { defaults, superForm } from "sveltekit-superforms";
  import { toast } from "svelte-sonner";
  import * as Form from "$lib/components/ui/form/index.js";
  import { Input } from "../ui/input";
  import { createMutation } from "@tanstack/svelte-query";
  import { orpcQuery } from "$lib/client/orpc";
  import { zod } from "sveltekit-superforms/adapters";

  const renameMutation = createMutation(
    orpcQuery.v1.chat.renameChat.mutationOptions({
      onSuccess: () => {
        toast.success("Chat title updated");
        open = false;
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = superForm(defaults({ title: currentTitle }, zod(formSchema)), {
    validators: zod(formSchema),
    SPA: true,
    onUpdate(event) {
      if (event.form.valid) {
        $renameMutation.mutate({ chatId, newTitle: event.form.data.title });
      }
    },
  });

  const { form: formData, enhance } = form;
</script>

<Dialog bind:open>
  <DialogTrigger>
    {@render trigger?.()}
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Chat Title</DialogTitle>
    </DialogHeader>

    <form method="POST" class="space-y-6" use:enhance>
      <Form.Field {form} name="title">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Title</Form.Label>
            <Input {...props} bind:value={$formData.title} />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
      <DialogFooter>
        <Form.Button>Submit</Form.Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
