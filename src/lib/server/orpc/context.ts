import { os } from "@orpc/server";
import type { UserContext } from "$lib/server/api";
import type { Cookies } from "@sveltejs/kit";

export const osBase = os
  .$context<{
    headers: Headers;
    ctx?: ExecutionContext;
    userCtx: UserContext;
    cookies?: Cookies;
    setHeaders?: (headers: Record<string, string>) => void;
  }>()
  .errors({
    SESSION_NOT_VERIFIED: {
      status: 403,
      message: "Session is not verified",
    },
  });
