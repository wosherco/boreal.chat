import type { PageServerLoad } from "./$types";
import { createORPCServerLink } from "$lib/server/orpc/client";

export const load: PageServerLoad = ({ locals, request, cookies }) => {
  if (!locals.user) {
    return {
      byok: {
        openrouter: null,
      },
    };
  }

  const openRouterAccount = createORPCServerLink({
    headers: request.headers,
    locals,
    cookies,
  }).v1.byok.get();

  return {
    byok: {
      openrouter: openRouterAccount,
    },
  };
};
