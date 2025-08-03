<script lang="ts" module>
  import { z } from "zod";
  import { passwordSchema } from "$lib/common/validators/auth";

  const formSchema = z.object({
    name: z.string().min(1).max(255),
    email: z.string().email(),
    password: passwordSchema,
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
  import TurnstileCaptcha from "$lib/components/TurnstileCaptcha.svelte";
  import { safeValidateEmail } from "$lib/utils/email";
  import { getDbInstance } from "$lib/client/db/index.svelte";

  let turnstileToken = $state<string | undefined>(undefined);

  onMount(() => {
    const nameInput = document.querySelector("input[name='name']") as HTMLInputElement;
    nameInput?.focus();
  });

  const signupMutation = createMutation(
    orpcQuery.v1.auth.register.mutationOptions({
      onSuccess: async (res) => {
        if (res.success) {
          await goto(res.redirect);
          await getDbInstance().forceConnectionCheck();
        }
      },
      onError: (error) => {
        toast.error(error.message);
        console.error(error);
      },
    }),
  );

  const form = superForm(
    defaults(
      {
        name: "",
        email: safeValidateEmail(page.url.searchParams.get("email")),
        password: "",
      },
      zod(formSchema),
    ),
    {
      validators: zod(formSchema),
      SPA: true,
      async onUpdate(event) {
        if (event.form.valid) {
          return $signupMutation.mutateAsync({
            ...event.form.data,
            turnstileToken,
          });
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
<h2 class="mb-2 text-center text-2xl font-semibold">Sign up to boreal.chat</h2>
<!-- Email Form -->
<form class="w-full space-y-6" use:enhance>
  <Form.Field {form} name="name">
    <Form.Control>
      {#snippet children({ props })}
        <Form.Label>Name</Form.Label>
        <Input {...props} bind:value={$formData.name} />
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

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
      {/snippet}
    </Form.Control>
    <Form.FieldErrors />
  </Form.Field>

  <TurnstileCaptcha class="mx-auto w-fit" bind:turnstileToken />

  <Form.Button disabled={$signupMutation.isPending} class="mt-2 w-full">
    {#if $signupMutation.isPending}
      <Loader2Icon class="size-4 animate-spin" />
    {:else}
      Sign up
    {/if}
  </Form.Button>
</form>

<!-- Sign in link -->
<div class="mt-4 w-full text-center">
  <p class="text-muted-foreground text-sm">
    Already have an account? <a
      href={`/auth/signin?email=${$formData.email ?? ""}`}
      class="underline">Sign in</a
    >
  </p>
</div>
