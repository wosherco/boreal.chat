import { os } from "@orpc/server";
import type { UserContext } from "$lib/server/api";

export const osBase = os.$context<{
  headers: Headers;
  ctx?: ExecutionContext;
  userCtx: UserContext;
}>();
