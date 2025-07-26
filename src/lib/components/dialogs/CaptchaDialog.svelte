<script lang="ts">
  import TurnstileCaptcha from "../TurnstileCaptcha.svelte";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "../ui/dialog";

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

<Dialog bind:open {onOpenChange}>
  <DialogContent showCloseButton={false} class="max-w-md">
    <DialogHeader>
      <DialogTitle>Before you continue</DialogTitle>
      <DialogDescription>We need to verify that you are not a bot.</DialogDescription>
    </DialogHeader>
    <TurnstileCaptcha onSuccess={onSuccessMiddleware} />
  </DialogContent>
</Dialog>
