import { env } from "$env/dynamic/private";
import { s3FileMetadata } from "$lib/server/services/files/s3";
import { z } from "zod/v4";
import { jwtVerify, SignJWT } from "jose";

export function signJwt(payload: z.infer<typeof s3FileMetadata>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15min")
    .sign(new TextEncoder().encode(env.AUTH_ENCRYPTION_KEY));
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(env.AUTH_ENCRYPTION_KEY));

  const parsed = s3FileMetadata.safeParse(payload);

  if (!parsed.success) {
    throw new Error("Invalid token");
  }

  return parsed.data;
}
