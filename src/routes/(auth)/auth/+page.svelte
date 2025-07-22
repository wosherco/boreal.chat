<script lang="ts" module>
  import { z } from "zod";

  const formSchema = z.object({
    email: z.string().email(),
  });
</script>

<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import Input from "$lib/components/ui/input/input.svelte";
  import { zod } from "sveltekit-superforms/adapters";
  import { defaults, superForm } from "sveltekit-superforms";
  import { goto } from "$app/navigation";
  import Checkbox from "$lib/components/ui/checkbox/checkbox.svelte";
  import logo from "$lib/assets/logo.png";
  import * as Form from "$lib/components/ui/form";
  import { Loader2Icon } from "@lucide/svelte";
  import SignUpLink from "$lib/components/auth/SignUpLink.svelte";

  const form = superForm(defaults({ email: "" }, zod(formSchema)), {
    validators: zod(formSchema),
    SPA: true,
    async onUpdate(event) {
      if (event.form.valid) {
        await goto(`/auth/signin?email=${encodeURIComponent(event.form.data.email)}`);
      }
    },
  });

  const { form: formData, enhance, delayed } = form;

  let agreed = false;
</script>

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

  <Form.Button disabled={$delayed} class="mt-2 w-full">
    {#if $delayed}
      <Loader2Icon class="size-4 animate-spin" />
    {:else}
      Continue
    {/if}
  </Form.Button>
</form>

<!-- Sign up link -->
<SignUpLink email={$formData.email} />

<!-- Divider -->
<div class="my-4 flex w-full items-center">
  <div class="flex-grow border-t border-gray-300"></div>
  <span class="text-muted-foreground mx-4 text-xs">OR</span>
  <div class="flex-grow border-t border-gray-300"></div>
</div>

<!-- OAuth Buttons -->
<div class="mb-4 flex w-full flex-col gap-2">
  <Button
    variant="outline"
    class="flex w-full items-center justify-center gap-2"
    href="/auth/google"
    disabled={!agreed}
  >
    <span class="text-lg">G</span>
    Continue with Google
  </Button>
</div>

<!-- Agree to Terms Checkbox (for OAuth only) -->
<div class="mb-2 flex w-full items-center gap-2">
  <Checkbox id="agree" bind:checked={agreed} />
  <label for="agree" class="cursor-pointer text-sm select-none">
    I agree to the <a href="https://boreal.chat/terms-of-service" class="underline" target="_blank"
      >Terms of Service</a
    >
    and
    <a href="https://boreal.chat/privacy-policy" class="underline" target="_blank">Privacy Policy</a
    >
  </label>
</div>
