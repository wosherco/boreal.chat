<script lang="ts">
  import { createMutation } from "@tanstack/svelte-query";
  import { orpcQuery } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";
  import { Button } from "$lib/components/ui/button";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Loader2Icon, MailIcon } from "@lucide/svelte";
  import { createCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import type { PageProps } from "./$types";

  const { data }: PageProps = $props();
  const currentUser = createCurrentUser(() => data.auth.currentUserInfo);

  const requestPasswordResetMutation = createMutation(
    orpcQuery.v1.auth.requestPasswordResetAuthenticated.mutationOptions({
      onSuccess: async () => {
        toast.success("Verification code sent to your email");
        await goto("/settings/authentication/reset-password/verify-email");
      },
      onError: (error) => {
        toast.error(error.message);
        console.error(error);
      },
    }),
  );

  function handleSendCode() {
    $requestPasswordResetMutation.mutateAsync({});
  }
</script>

<svelte:head>
  <title>Reset Password | boreal.chat</title>
</svelte:head>

<div class="mx-auto max-w-md">
  <Card>
    <CardHeader class="text-center">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <MailIcon class="h-6 w-6 text-blue-600" />
      </div>
      <CardTitle class="text-xl">Reset Your Password</CardTitle>
      <p class="text-muted-foreground text-sm">
        We'll send a verification code to your email address to confirm it's you.
      </p>
    </CardHeader>
    <CardContent class="space-y-4">
      {#if currentUser.data?.authenticated && currentUser.data?.data}
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-sm font-medium">Email Address:</p>
          <p class="text-muted-foreground text-sm">{currentUser.data.data.email}</p>
        </div>

        <Button 
          onclick={handleSendCode}
          disabled={$requestPasswordResetMutation.isPending}
          class="w-full"
        >
          {#if $requestPasswordResetMutation.isPending}
            <Loader2Icon class="mr-2 h-4 w-4 animate-spin" />
            Sending Code...
          {:else}
            Send Verification Code
          {/if}
        </Button>

        <div class="text-center">
          <Button variant="link" href="/settings/authentication" class="text-sm">
            Cancel
          </Button>
        </div>
      {:else}
        <p class="text-center text-red-600">Please log in to reset your password.</p>
        <Button href="/auth/login" class="w-full">Log In</Button>
      {/if}
    </CardContent>
  </Card>
</div>