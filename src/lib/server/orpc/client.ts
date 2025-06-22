import { createRouterClient } from "@orpc/server";
import { appRouter } from "./router";
import type { Cookies } from "@sveltejs/kit";

export const createORPCServerLink = ({
  headers,
  locals,
  cookies,
}: {
  headers: Headers;
  locals: App.Locals;
  cookies: Cookies;
}) => {
  return createRouterClient(appRouter, {
    context: async () => ({
      headers: headers,
      cookies,
      ctx: undefined,
      userCtx: {
        session: locals.session,
        user: locals.user,
      },
    }),
  });
};
