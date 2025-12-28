export const ssr = (import.meta.env.VITE_PLATFORM as string | undefined) === "web";

import posthog from "posthog-js";
import { browser } from "$app/environment";
import type { LayoutLoad } from "./$types";
import { pickSSRorSPAPromise } from "$lib/client/hooks/pickSSRorSPA.svelte";
import { orpc } from "$lib/client/orpc";
import { ORPCError } from "@orpc/client";
import { env } from "$env/dynamic/public";
import { POSTHOG_PROXY_PATH } from "$lib/common/constants";
import { createFlagsmithInstance } from "flagsmith/isomorphic";
import type { IFlagsmith } from "flagsmith";
import * as Sentry from "@sentry/sveltekit";

let flagsmithInstanceCache: IFlagsmith | undefined;

export const load: LayoutLoad = async ({ data }) => {
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

  let localFlagsmithInstance: IFlagsmith | undefined;

  if (!flagsmithInstanceCache && env.PUBLIC_FLAGSMITH_ENVIRONMENT_ID) {
    const flagsmithInstance = createFlagsmithInstance();
    await flagsmithInstance.init({
      environmentID: env.PUBLIC_FLAGSMITH_ENVIRONMENT_ID,
      state: data.flags.state,
      sentryClient: Sentry.getClient(),
      identity: currentUserInfo?.data?.id,
    });

    localFlagsmithInstance = flagsmithInstance;

    if (browser) {
      flagsmithInstanceCache = flagsmithInstance;
    }
  }

  if (browser) {
    posthog.init(env.PUBLIC_POSTHOG_API_KEY, {
      api_host: POSTHOG_PROXY_PATH,
      ui_host: env.PUBLIC_POSTHOG_HOST,
      person_profiles: "identified_only",
    });
  }

  return {
    auth: {
      currentUserInfo,
    },
    flags: {
      flagsmith: browser
        ? (flagsmithInstanceCache ?? localFlagsmithInstance)
        : localFlagsmithInstance,
    },
  };
};
