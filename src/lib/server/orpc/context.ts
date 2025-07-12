import { os } from "@orpc/server";
import type { UserContext } from "$lib/server/api";
import type { Cookies } from "@sveltejs/kit";

export const osBase = os.$context<{
  headers: Headers;
  ctx?: ExecutionContext;
  userCtx: UserContext;
  cookies?: Cookies;
  setHeaders?: (headers: Record<string, string>) => void;
}>();
