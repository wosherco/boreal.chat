<script lang="ts" module>
  import { z } from "zod";

  const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(255),
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
  import SignUpLink from "$lib/components/auth/SignUpLink.svelte";
  import { page } from "$app/state";
  import { createMutation } from "@tanstack/svelte-query";
  import { orpcQuery } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";
  import AuthBackArrow from "$lib/components/auth/AuthBackArrow.svelte";

  onMount(() => {
    const passwordInput = document.querySelector("input[name='password']") as HTMLInputElement;
    passwordInput?.focus();
  });

  const loginMutation = createMutation(
    orpcQuery.v1.auth.login.mutationOptions({
      onSuccess: async (res) => {
        if (res.success) {
          await goto(res.redirect);

          if (res.done) {
            // Refreshing to pglite boots up
            window.location.reload();
          }
        }
      },
      onError: (error) => {
        toast.error(error.message);
        console.error(error);
      },
    }),
  );

  const form = superForm(
    defaults({ email: page.url.searchParams.get("email") ?? "", password: "" }, zod(formSchema)),
    {
      validators: zod(formSchema),
      SPA: true,
      async onUpdate(event) {
        if (event.form.valid) {
          return $loginMutation.mutateAsync(event.form.data);
        }
      },
    },
  );

  const { form: formData, enhance } = form;
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
<h2 class="mb-2 text-center text-2xl font-semibold">Sign in to boreal.chat</h2>
<!-- Email Form -->
<form class="w-full space-y-6" use:enhance>
  <Form.Field {form} name="email">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Email</Form.Label>
        <Input {...props} bind:value={$formData.email} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Field {form} name="password">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Password</Form.Label>
        <Input {...props} bind:value={$formData.password} type="password" />
        <Form.Description>
          Forgot your password? <a
            href="/auth/forgot-password?email={encodeURIComponent($formData.email)}"
            class="underline">Reset it</a
          >
        </Form.Description>
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <Form.Button disabled={$loginMutation.isPending} class="mt-2 w-full">
    {#if $loginMutation.isPending}
      <Loader2Icon class="size-4 animate-spin" />
    {:else}
      Sign in
    {/if}
  </Form.Button>
</form>

<!-- Sign up link -->
<SignUpLink email={$formData.email} />
