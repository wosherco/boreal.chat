<script lang="ts">
  import { waitForTurnstile } from "$lib/client/services/turnstile.svelte";
  import { TURNSTILE_SITE_KEY } from "$lib/common/turnstile";
  import { onMount } from "svelte";

  interface Props {
    /**
     * @bindable overriding won't do anything, just shoot urself in the foot
     */
    turnstileToken?: string;
    class?: string;
    onSuccess?: (token: string) => void;
  }

  let { turnstileToken = $bindable(), class: className, onSuccess }: Props = $props();

  const randomId = Math.random().toString(36).substring(2, 15);
  const id = `captcha-${randomId}`;

  function renderCaptcha() {
    turnstile.render(`#${id}`, {
      sitekey: TURNSTILE_SITE_KEY,

      callback: (token: string) => {
        turnstileToken = token;
        onSuccess?.(token);
      },
    });
  }

  onMount(async () => {
    await waitForTurnstile();
    renderCaptcha();
  });
</script>

<div {id} data-sitekey={TURNSTILE_SITE_KEY} class={className}></div>
