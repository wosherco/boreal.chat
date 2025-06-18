import posthog from "posthog-js";
import { browser } from "$app/environment";

export const load = async () => {
  if (browser) {
    posthog.init("phc_a2qpwc0fnaCPlkK4kBZe0mZrdQiFSBbdCE0pNtCnGpZ", {
      api_host: "https://eu.i.posthog.com",
      person_profiles: "identified_only",
    });
  }

  return;
};
