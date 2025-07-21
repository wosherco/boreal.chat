<script lang="ts" module>
  import { z } from "zod";

  const formSchema = z.object({
    code: z.string().min(8).max(8),
  });
</script>

<script lang="ts">
  import Input from "$lib/components/ui/input/input.svelte";
  import { onMount } from "svelte";
  import { zod } from "sveltekit-superforms/adapters";
  import { defaults, superForm } from "sveltekit-superforms";
  import { goto } from "$app/navigation";
  import logo from "$lib/assets/logo.png";
  import * as Form from "$lib/components/ui/form";
  import { Loader2Icon } from "@lucide/svelte";
  import { page } from "$app/state";
  import { createMutation } from "@tanstack/svelte-query";
  import { orpcQuery } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";
  import AuthBackArrow from "$lib/components/auth/AuthBackArrow.svelte";
  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();

  onMount(() => {
    const codeInput = document.querySelector("input[name='code']") as HTMLInputElement;
    codeInput?.focus();
  });

  const requestPasswordResetMutation = createMutation(
    orpcQuery.v1.auth.passwordResetVerifyEmail.mutationOptions({
      onSuccess: async (res) => {
        if (res.success) {
          await goto("/auth/reset-password");
          toast.success("Email verified. You can now reset your password.");
        }
      },
      onError: (error) => {
        toast.error(error.message);
        console.error(error);
      },
    }),
  );

  const form = superForm(
    defaults({ code: page.url.searchParams.get("code") ?? "" }, zod(formSchema)),
    {
      validators: zod(formSchema),
      SPA: true,
      async onUpdate(event) {
        if (event.form.valid) {
          return $requestPasswordResetMutation.mutateAsync(event.form.data);
        }
      },
    },
  );

  const { form: formData, enhance, delayed } = form;
</script>

<AuthBackArrow />

<!-- Logo Placeholder -->
<div class="mb-6 flex items-center justify-center">
  <div
    class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500"
  >
    <!-- Replace with logo -->
    <img src={logo} alt="boreal.chat" class="size-8" />
  </div>
</div>
<!-- Title -->
<h2 class="mb-2 text-center text-2xl font-semibold">Verify your email</h2>
<!-- Email Form -->
<form class="w-full space-y-6" use:enhance>
  <Form.Field {form} name="code">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Code</Form.Label>
        <Input {...props} bind:value={$formData.code} />
        <Form.Description>
          Check your email for the reset code. We sent the code to <b>{data.email}</b>.
        </Form.Description>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button disabled={$requestPasswordResetMutation.isPending} class="mt-2 w-full">
    {#if $requestPasswordResetMutation.isPending}
      <Loader2Icon class="size-4 animate-spin" />
    {:else}
      Submit
    {/if}
  </Form.Button>
</form>
