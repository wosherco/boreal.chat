<script lang="ts">
  import { waitForTurnstile } from "$lib/client/services/turnstile.svelte";
  import { TURNSTILE_SITE_KEY } from "$lib/common/turnstile";
  import { onMount } from "svelte";

  interface Props {
    id?: string;
    /**
     * @bindable overriding won't do anything, just shoot urself in the foot
     */
    turnstileToken?: string;
    class?: string;
    onSuccess?: (token: string) => void;
  }

  let {
    id = Math.random().toString(36).substring(2, 15),
    turnstileToken = $bindable(),
    class: className,
    onSuccess,
  }: Props = $props();

  const elementId = `captcha-${id}`;

  function renderCaptcha() {
    console.log("Rendering captcha", elementId);
    turnstile.render(`#${elementId}`, {
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

<div id={elementId} data-sitekey={TURNSTILE_SITE_KEY} class={className}></div>
