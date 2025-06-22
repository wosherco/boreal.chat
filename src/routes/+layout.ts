import posthog from "posthog-js";
import { browser } from "$app/environment";
import type { LayoutLoad } from "./$types";
import { pickSSRorSPAPromise } from "$lib/client/hooks/pickSSRorSPA.svelte";
import { orpc } from "$lib/client/orpc";
import { ORPCError } from "@orpc/client";

export const load: LayoutLoad = async ({ data }) => {
  if (browser) {
    posthog.init("phc_a2qpwc0fnaCPlkK4kBZe0mZrdQiFSBbdCE0pNtCnGpZ", {
      api_host: "https://eu.i.posthog.com",
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
