import { z } from "zod/v4";

export function cleanEmail(email: string) {
  return email.trim().toLowerCase();
}

export function safeValidateEmail(email: string | null | undefined): string | undefined {
  if (!email || email.length === 0) {
    return undefined;
  }

  if (!z.email().safeParse(email).success) {
    return undefined;
  }

  return email;
}
