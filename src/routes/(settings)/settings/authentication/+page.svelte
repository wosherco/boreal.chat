<script lang="ts">
  import { createCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import type { PageProps } from "./$types";
  import Button from "$lib/components/ui/button/button.svelte";
  import { createMutation } from "@tanstack/svelte-query";
  import { orpcQuery } from "$lib/client/orpc";
  import { toast } from "svelte-sonner";
  import { Loader2Icon } from "@lucide/svelte";
  import { goto } from "$app/navigation";
  import SettingsLayout from "$lib/components/settings/SettingsLayout.svelte";

  const { data }: PageProps = $props();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentUser = createCurrentUser(() => data.auth.currentUserInfo);

  const requestPasswordResetMutation = createMutation(
    orpcQuery.v1.auth.requestPasswordResetAuthenticated.mutationOptions({
      onSuccess: async (res) => {
        if (res.redirect) {
          await goto(res.redirect);
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );
</script>

<SettingsLayout title="Authentication" description="Manage your authentication settings.">
  <div class="mt-8 space-y-8">
    <!-- Password Reset Section -->
    <section class="bg-card rounded-lg border p-6 shadow">
      <h3 class="mb-2 text-lg font-semibold">Reset Password</h3>
      <p class="text-muted-foreground mb-4">Change your account password.</p>
      <Button
        onclick={() => $requestPasswordResetMutation.mutate({})}
        disabled={$requestPasswordResetMutation.isPending}
      >
        {#if $requestPasswordResetMutation.isPending}
          <Loader2Icon class="size-4 animate-spin" />
        {/if}
        Reset Password
      </Button>
    </section>

    <!-- OAuth Accounts Section (Google) -->
    <section class="bg-card pointer-events-none rounded-lg border p-6 opacity-60 shadow">
      <h3 class="mb-2 text-lg font-semibold">OAuth Accounts</h3>
      <p class="text-muted-foreground mb-4">Link your account with Google for easy sign-in.</p>
      <Button disabled>Connect Google Account</Button>
      <span class="text-muted-foreground ml-2 text-xs">Coming Soon</span>
    </section>

    <!-- 2FA Section -->
    <section class="bg-card pointer-events-none rounded-lg border p-6 opacity-60 shadow">
      <h3 class="mb-2 text-lg font-semibold">Two-Factor Authentication (2FA)</h3>
      <p class="text-muted-foreground mb-4">Add an extra layer of security to your account.</p>
      <Button disabled>Enable 2FA</Button>
      <span class="text-muted-foreground ml-2 text-xs">Coming Soon</span>
    </section>

    <!-- Passkeys and Security Keys Section -->
    <section class="bg-card pointer-events-none rounded-lg border p-6 opacity-60 shadow">
      <h3 class="mb-2 text-lg font-semibold">Passkeys & Security Keys</h3>
      <p class="text-muted-foreground mb-4">
        Use passkeys or hardware security keys for passwordless login.
      </p>
      <Button disabled>Manage Security Keys</Button>
      <span class="text-muted-foreground ml-2 text-xs">Coming Soon</span>
    </section>
  </div>
</SettingsLayout>
