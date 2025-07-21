<script lang="ts">
  import { TURNSTILE_SITE_KEY } from "$lib/common/turnstile";
  import { onMount } from "svelte";

  interface Props {
    /**
     * @bindable overriding won't do anything, just shoot urself in the foot
     */
    turnstileToken?: string;
    class?: string;
  }

  let { turnstileToken = $bindable(), class: className }: Props = $props();

  const randomId = Math.random().toString(36).substring(2, 15);
  const id = `captcha-${randomId}`;

  onMount(() => {
    const renderCaptcha = () =>
      turnstile.render(`#${id}`, {
        sitekey: TURNSTILE_SITE_KEY,

        callback: (token: string) => {
          turnstileToken = token;
        },
      });
    console.log("MOUNTING THIS THING");

    try {
      renderCaptcha();
    } catch (e) {
      // @ts-expect-error - Turnstile callback is not typed
      window.onloadTurnstileCallback = () => {
        console.log("RENDERING");
        renderCaptcha();
      };
    }
  });
</script>

<svelte:head>
  <script
    src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback"
    defer
  ></script>
</svelte:head>

<div {id} data-sitekey={TURNSTILE_SITE_KEY} class={className}></div>
