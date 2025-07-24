import { dev } from "$app/environment";
import { env } from "$env/dynamic/private";
import { z } from "zod/v4";

const basicTurnstileSchema = z.object({
  success: z.boolean(),
});

export const TURNSTILE_SECRET_KEY = dev
  ? "1x0000000000000000000000000000000AA"
  : env.TURNSTILE_SECRET_KEY;

export async function verifyTurnstileToken(
  turnstileToken: string,
  clientIp: string,
  fallback = false,
) {
  if (!TURNSTILE_SECRET_KEY) {
    return fallback;
  }

  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const result = await fetch(url, {
    body: JSON.stringify({
      secret: TURNSTILE_SECRET_KEY,
      response: turnstileToken,
      remoteip: clientIp,
    }),
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await basicTurnstileSchema.safeParseAsync(await result.json());

  if (!data.success || !data.data.success) {
    return false;
  }

  return true;
}
