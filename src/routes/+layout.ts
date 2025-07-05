import posthog from "posthog-js";
import { browser } from "$app/environment";
import type { LayoutLoad } from "./$types";
import { pickSSRorSPAPromise } from "$lib/client/hooks/pickSSRorSPA.svelte";
import { orpc } from "$lib/client/orpc";
import { ORPCError } from "@orpc/client";
import { env } from "$env/dynamic/public";
import { getCookieConsent } from "$lib/utils/localStorage";

export const load: LayoutLoad = async ({ data }) => {
  if (browser) {
    // Only initialize PostHog if user has accepted cookies
    const cookieConsent = getCookieConsent();
    
    if (cookieConsent === "accepted" && env.PUBLIC_POSTHOG_API_KEY && env.PUBLIC_POSTHOG_HOST) {
      posthog.init(env.PUBLIC_POSTHOG_API_KEY, {
        api_host: env.PUBLIC_POSTHOG_HOST,
        person_profiles: "identified_only",
      });
    } else if (cookieConsent === "declined") {
      // Ensure PostHog is not initialized/shut down if declined
      if (posthog.__loaded) {
        posthog.reset();
      }
    }
    // If consent is null (not answered yet), don't initialize PostHog
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
