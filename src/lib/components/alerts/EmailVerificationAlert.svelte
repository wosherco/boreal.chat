<script lang="ts">
  import { MailWarningIcon } from "@lucide/svelte";
  import AlertDescription from "../ui/alert/alert-description.svelte";
  import AlertTitle from "../ui/alert/alert-title.svelte";
  import Alert from "../ui/alert/alert.svelte";
  import Button from "../ui/button/button.svelte";
</script>

<Alert variant="warning">
  <MailWarningIcon class="size-4" />
  <AlertTitle>Email not verified</AlertTitle>
  <AlertDescription>
    Your email is not verified. Your functionality will be limited until you verify your email.
    <Button href="/auth/verify-email" class="m-1">Verify email</Button>
  </AlertDescription>
</Alert>
