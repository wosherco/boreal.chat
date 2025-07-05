import posthog from "posthog-js";
import { browser } from "$app/environment";
import type { LayoutLoad } from "./$types";
import { pickSSRorSPAPromise } from "$lib/client/hooks/pickSSRorSPA.svelte";
import { orpc } from "$lib/client/orpc";
import { ORPCError } from "@orpc/client";
import { env } from "$env/dynamic/public";
import { POSTHOG_PROXY_PATH } from "$lib/common/constants";

export const load: LayoutLoad = async ({ data }) => {
  if (browser) {
    posthog.init(env.PUBLIC_POSTHOG_API_KEY, {
      api_host: POSTHOG_PROXY_PATH,
      ui_host: env.PUBLIC_POSTHOG_HOST,
      person_profiles: "identified_only",
    });
  }

  const currentUserInfo = await pickSSRorSPAPromise(
    Promise.resolve(data.auth.currentUserInfo),
    () =>
      orpc.v1.auth.getUser().catch((err) => {
        if (err instanceof ORPCError && err.status === 401) {
          return null;
        }

        throw err;
      }),
  );

  return {
    auth: {
      currentUserInfo,
    },
  };
};
