<script lang="ts">
  import TurnstileCaptcha from "../TurnstileCaptcha.svelte";
  import { AlertDialog, AlertDialogContent } from "../ui/alert-dialog";
  import { AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "../ui/alert-dialog";

  interface Props {
    /**
     * @bindable
     */
    open?: boolean;
    onSuccess: (token: string | undefined) => void;
  }

  let { open = $bindable(false), onSuccess }: Props = $props();

  function onOpenChange(open: boolean) {
    if (!open) {
      onSuccess(undefined);
    }
  }

  function onSuccessMiddleware(token: string | undefined) {
    onSuccess(token);
    open = false;
  }
</script>

<AlertDialog bind:open {onOpenChange}>
  <AlertDialogContent class="max-w-md">
    <AlertDialogHeader>
      <AlertDialogTitle>Before you continue</AlertDialogTitle>
      <AlertDialogDescription>We need to verify that you are not a bot.</AlertDialogDescription>
    </AlertDialogHeader>
    <TurnstileCaptcha class="mx-auto w-fit" onSuccess={onSuccessMiddleware} />
  </AlertDialogContent>
</AlertDialog>
