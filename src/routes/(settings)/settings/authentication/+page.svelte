<script lang="ts">
  import { createCurrentUser } from "$lib/client/hooks/useCurrentUser.svelte";
  import type { PageProps } from "./$types";
  import Button from "$lib/components/ui/button/button.svelte";
  import SettingsLayout from "$lib/components/settings/SettingsLayout.svelte";

  const { data }: PageProps = $props();

  const currentUser = createCurrentUser(() => data.auth.currentUserInfo);
</script>

<SettingsLayout title="Authentication" description="Manage your authentication settings.">
  <div class="mt-8 space-y-8">
    <!-- Password Reset Section -->
    <section class="bg-card rounded-lg border p-6 shadow">
      <h3 class="mb-2 text-lg font-semibold">Password Reset</h3>
      <p class="text-muted-foreground mb-4">Change your account password.</p>
      <Button disabled>Reset Password (soon...)</Button>
      <!-- TODO: Wire up password reset logic -->
    </section>

    <!-- OAuth Accounts Section (Google) -->
    <section class="bg-card pointer-events-none rounded-lg border p-6 opacity-60 shadow">
      <h3 class="mb-2 text-lg font-semibold">OAuth Accounts</h3>
      <p class="text-muted-foreground mb-4">Link your account with Google for easy sign-in.</p>
      <button class="btn btn-secondary" disabled>Connect Google Account</button>
      <span class="text-muted-foreground ml-2 text-xs">Coming Soon</span>
    </section>

    <!-- 2FA Section -->
    <section class="bg-card pointer-events-none rounded-lg border p-6 opacity-60 shadow">
      <h3 class="mb-2 text-lg font-semibold">Two-Factor Authentication (2FA)</h3>
      <p class="text-muted-foreground mb-4">Add an extra layer of security to your account.</p>
      <button class="btn btn-secondary" disabled>Enable 2FA</button>
      <span class="text-muted-foreground ml-2 text-xs">Coming Soon</span>
    </section>

    <!-- Passkeys and Security Keys Section -->
    <section class="bg-card pointer-events-none rounded-lg border p-6 opacity-60 shadow">
      <h3 class="mb-2 text-lg font-semibold">Passkeys & Security Keys</h3>
      <p class="text-muted-foreground mb-4">
        Use passkeys or hardware security keys for passwordless login.
      </p>
      <button class="btn btn-secondary" disabled>Manage Security Keys</button>
      <span class="text-muted-foreground ml-2 text-xs">Coming Soon</span>
    </section>
  </div>
</SettingsLayout>
