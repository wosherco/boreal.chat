import CaptchaDialog from "$lib/components/dialogs/CaptchaDialog.svelte";
import { mount } from "svelte";

let turnstileLoaded = $state(false);

let turnstilePromiseCache: Promise<void> | undefined;

export async function waitForTurnstile() {
  if (turnstileLoaded) {
    return;
  }

  if (turnstilePromiseCache) {
    return turnstilePromiseCache;
  }

  turnstilePromiseCache = new Promise((resolve) => {
    try {
      turnstile.ready(() => {
        turnstileLoaded = true;
        resolve();
      });
    } catch {
      // @ts-expect-error - Turnstile callback is not typed
      window.onloadTurnstileCallback = () => {
        turnstileLoaded = true;
        resolve();
      };
    }
  });
}

export const isTurnstileLoaded = () => turnstileLoaded;

export async function openCaptchaDialog(timeout = 30000): Promise<string | undefined> {
  const container = document.createElement("div");

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      container.remove();
      reject(new Error("Captcha dialog timed out"));
    }, timeout);

    const onSuccess = (token: string | undefined) => {
      clearTimeout(timeoutId);
      resolve(token);
      container.remove();
    };

    mount(CaptchaDialog, {
      target: container,
      props: {
        onSuccess,
        open: true,
      },
    });
  });
}
