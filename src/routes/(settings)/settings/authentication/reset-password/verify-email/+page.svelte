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
  import * as Form from "$lib/components/ui/form";
  import { Loader2Icon, MailIcon } from "@lucide/svelte";
  import { createMutation } from "@tanstack/svelte-query";
  import { orpcQuery } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { page } from "$app/state";

  onMount(() => {
    const codeInput = document.querySelector("input[name='code']") as HTMLInputElement;
    codeInput?.focus();
  });

  const verifyEmailForPasswordResetSessionMutation = createMutation(
    orpcQuery.v1.auth.passwordResetVerifyEmail.mutationOptions({
      onSuccess: async (res) => {
        if (res.success) {
          await goto("/settings/authentication/reset-password/new-password");
          toast.success("Email verified successfully");
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
          return $verifyEmailForPasswordResetSessionMutation.mutateAsync(event.form.data);
        }
      },
    },
  );

  const { form: formData, enhance } = form;
</script>

<svelte:head>
  <title>Verify Email | boreal.chat</title>
</svelte:head>

<div class="mx-auto max-w-md">
  <Card>
    <CardHeader class="text-center">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <MailIcon class="h-6 w-6 text-blue-600" />
      </div>
      <CardTitle class="text-xl">Check Your Email</CardTitle>
      <p class="text-muted-foreground text-sm">
        We've sent an 8-digit verification code to your email address.
      </p>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" use:enhance>
        <Form.Field {form} name="code">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Verification Code</Form.Label>
              <Input 
                {...props} 
                bind:value={$formData.code} 
                type="text" 
                placeholder="Enter 8-digit code"
                class="text-center text-lg tracking-widest"
                maxlength={8}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Button 
          disabled={$verifyEmailForPasswordResetSessionMutation.isPending} 
          class="w-full"
        >
          {#if $verifyEmailForPasswordResetSessionMutation.isPending}
            <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          {:else}
            Verify Code
          {/if}
        </Form.Button>

        <div class="text-center">
          <Button variant="link" href="/settings/authentication/reset-password" class="text-sm">
            Resend Code
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>