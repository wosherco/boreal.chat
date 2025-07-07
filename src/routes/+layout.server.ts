import { createORPCServerLink } from "$lib/server/orpc/client";
import { ORPCError } from "@orpc/client";
import type { LayoutServerLoad } from "./$types";
import { browser } from "$app/environment";
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

  // Initialize Flagsmith on server side if environment key is available
  let flagsmithState = null;
  if (!browser && env.PUBLIC_FLAGSMITH_ENVIRONMENT_KEY) {
    try {
      const flagsmith = await import("flagsmith/isomorphic");
      await flagsmith.default.init({
        environmentID: env.PUBLIC_FLAGSMITH_ENVIRONMENT_KEY,
        enableLogs: false,
      });
      flagsmithState = flagsmith.default.getState();
    } catch (error) {
      console.error("Failed to initialize Flagsmith on server:", error);
    }
  }

  return {
    auth: {
      currentUserInfo,
    },
    flagsmithState,
  };
};
