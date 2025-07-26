import type { RequestHandler } from "./$types";
import { db } from "$lib/server/db";
import { byokTable } from "$lib/server/db/schema";

export const GET: RequestHandler = async (event) => {
  const code = event.url.searchParams.get("code");
  const codeVerifier = event.cookies.get("openrouter_code_verifier");
  const user = event.locals.user;

  if (!code || !codeVerifier || !user) {
    return new Response("Invalid request", { status: 400 });
  }

  const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      code_challenge_method: "S256",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("OpenRouter error", text);
    return new Response("Failed to obtain key", { status: 500 });
  }

  const data = (await res.json()) as { key: string; user_id: string };

  await db
    .insert(byokTable)
    .values({
      userId: user.id,
      platform: "openrouter",
      apiKey: data.key,
    })
    .onConflictDoUpdate({
      target: [byokTable.userId, byokTable.platform],
      set: {
        apiKey: data.key,
        platform: "openrouter",
      },
    });

  return new Response(null, {
    status: 302,
    headers: { Location: "/settings/byok" },
  });
};
