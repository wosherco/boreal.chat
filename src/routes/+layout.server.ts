import { createORPCServerLink } from "$lib/server/orpc/client";
import { ORPCError } from "@orpc/client";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, request, cookies }) => {
  const currentUserInfo = await createORPCServerLink({
    headers: request.headers,
    locals,
    cookies,
  })
    .v1.auth.getUser()
    .catch((err) => {
      if (err instanceof ORPCError && err.status === 401) {
        return null;
      }

      throw err;
    });

  return {
    auth: {
      currentUserInfo,
    },
    flagsmithFlags: locals.flagsmithFlags,
  };
};
