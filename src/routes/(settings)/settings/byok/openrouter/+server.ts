import { generateCodeVerifier } from "arctic";
import type { RequestHandler } from "./$types";
import { dev } from "$app/environment";
import { redirect } from "@sveltejs/kit";
import { createS256CodeChallenge } from "arctic/dist/oauth2";

export const GET: RequestHandler = ({ cookies, url }) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = createS256CodeChallenge(codeVerifier);

  cookies.set("openrouter_code_verifier", codeVerifier, {
    path: "/",
    httpOnly: !dev,
    secure: !dev,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  const callbackUrl = new URL("/settings/byok/openrouter/callback", url.origin);
  const openRouterUrl = new URL("https://openrouter.ai/auth");
  openRouterUrl.searchParams.set("callback_url", callbackUrl.toString());
  openRouterUrl.searchParams.set("code_challenge", codeChallenge);
  openRouterUrl.searchParams.set("code_challenge_method", "S256");

  throw redirect(302, openRouterUrl.toString());
};
