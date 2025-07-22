import { generateCodeVerifier, generateState } from "arctic";
import type { RequestHandler } from "./$types";
import { googleProvider } from "$lib/server/auth";
import { dev } from "$app/environment";
import { redirect } from "@sveltejs/kit";

export const GET: RequestHandler = ({ cookies }) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = googleProvider.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ]);

  cookies.set("google_oauth_state", state, {
    path: "/",
    httpOnly: !dev,
    secure: !dev,
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  });

  cookies.set("google_code_verifier", codeVerifier, {
    path: "/",
    httpOnly: !dev,
    secure: !dev,
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  });

  throw redirect(302, url);
};
