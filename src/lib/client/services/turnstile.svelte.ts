import CaptchaDialog from "$lib/components/dialogs/CaptchaDialog.svelte";
import { mount } from "svelte";
import { orpc } from "../orpc";

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
      if (turnstile) {
        turnstileLoaded = true;
        resolve();
      }
    } catch {
      // @ts-expect-error - Turnstile callback is not typed
      window.onloadTurnstileCallback = () => {
        turnstileLoaded = true;
        resolve();
      };
    }
  });

  return turnstilePromiseCache;
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

export async function verifySession(): Promise<boolean> {
  const token = await openCaptchaDialog();

  if (!token) {
    return false;
  }

  const verified = await orpc.v1.auth.verifySession({
    turnstileToken: token,
  });

  if (!verified.success) {
    return false;
  }

  return true;
}
