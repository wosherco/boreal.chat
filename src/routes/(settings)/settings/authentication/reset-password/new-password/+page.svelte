<script lang="ts" module>
  import { z } from "zod";
  import { passwordSchema } from "$lib/common/validators/auth";

  const formSchema = z.object({
    password: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
</script>

<script lang="ts">
  import Input from "$lib/components/ui/input/input.svelte";
  import { onMount } from "svelte";
  import { zod } from "sveltekit-superforms/adapters";
  import { defaults, superForm } from "sveltekit-superforms";
  import { goto } from "$app/navigation";
  import * as Form from "$lib/components/ui/form";
  import { Loader2Icon, LockIcon } from "@lucide/svelte";
  import { createMutation } from "@tanstack/svelte-query";
  import { orpcQuery } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";

  onMount(() => {
    const passwordInput = document.querySelector("input[name='password']") as HTMLInputElement;
    passwordInput?.focus();
  });

  const resetPasswordMutation = createMutation(
    orpcQuery.v1.auth.passwordResetAuthenticated.mutationOptions({
      onSuccess: async (res) => {
        if (res.success) {
          toast.success("Password changed successfully!");
          await goto(res.redirect || "/settings/authentication");
        }
      },
      onError: (error) => {
        toast.error(error.message);
        console.error(error);
      },
    }),
  );

  const form = superForm(defaults({ password: "", confirmPassword: "" }, zod(formSchema)), {
    validators: zod(formSchema),
    SPA: true,
    async onUpdate(event) {
      if (event.form.valid) {
        // Only send the password field to the API
        return $resetPasswordMutation.mutateAsync({ password: event.form.data.password });
      }
    },
  });

  const { form: formData, enhance } = form;
</script>

<svelte:head>
  <title>New Password | boreal.chat</title>
</svelte:head>

<div class="mx-auto max-w-md">
  <Card>
    <CardHeader class="text-center">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <LockIcon class="h-6 w-6 text-green-600" />
      </div>
      <CardTitle class="text-xl">Set New Password</CardTitle>
      <p class="text-muted-foreground text-sm">
        Choose a strong password for your account.
      </p>
    </CardHeader>
    <CardContent>
      <form class="space-y-4" use:enhance>
        <Form.Field {form} name="password">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>New Password</Form.Label>
              <Input {...props} bind:value={$formData.password} type="password" />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="confirmPassword">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label>Confirm New Password</Form.Label>
              <Input {...props} bind:value={$formData.confirmPassword} type="password" />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Button 
          disabled={$resetPasswordMutation.isPending} 
          class="w-full"
        >
          {#if $resetPasswordMutation.isPending}
            <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
            Changing Password...
          {:else}
            Change Password
          {/if}
        </Form.Button>

        <div class="text-center">
          <Button variant="link" href="/settings/authentication" class="text-sm">
            Cancel
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>