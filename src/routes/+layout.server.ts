import { createORPCServerLink } from "$lib/server/orpc/client";
import { ORPCError } from "@orpc/client";
import type { LayoutServerLoad } from "./$types";
import { createFlagsmithInstance } from "flagsmith/isomorphic";
import { env } from "$env/dynamic/public";

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

  const flagsmithInstance = createFlagsmithInstance();
  let initialized = false;

  if (env.PUBLIC_FLAGSMITH_ENVIRONMENT_ID) {
    await flagsmithInstance.init({
      environmentID: env.PUBLIC_FLAGSMITH_ENVIRONMENT_ID,
      identity:
        currentUserInfo && currentUserInfo.authenticated ? currentUserInfo.data?.id : undefined,
    });

    initialized = true;
  }

  return {
    auth: {
      currentUserInfo,
    },
    flags: {
      state: initialized ? flagsmithInstance.getState() : undefined,
    },
  };
};
