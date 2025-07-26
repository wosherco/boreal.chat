<script lang="ts">
  import { waitForTurnstile } from "$lib/client/services/turnstile.svelte";
  import { TURNSTILE_SITE_KEY } from "$lib/common/turnstile";
  import { onDestroy, onMount } from "svelte";
  import { toast } from "svelte-sonner";

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

  let renderedTurnstileId = $state<string | undefined | null>(undefined);

  onMount(async () => {
    await waitForTurnstile();

    renderedTurnstileId = turnstile.render(`#${elementId}`, {
      sitekey: TURNSTILE_SITE_KEY,

      callback: (token: string) => {
        turnstileToken = token;
        onSuccess?.(token);
      },
      "error-callback": (e) => {
        toast.error("Failed to render captcha");
        console.error("Turnstile error", e);
      },
    });
  });

  onDestroy(() => {
    if (renderedTurnstileId) {
      turnstile.remove(renderedTurnstileId);
    }
  });
</script>

<div id={elementId} class={className}></div>
