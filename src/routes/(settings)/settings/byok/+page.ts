import { pickSSRorSPAPromise } from "$lib/client/hooks/pickSSRorSPA.svelte";
import { orpc } from "$lib/client/orpc";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ data }) => {
  return {
    byok: {
      openrouter: pickSSRorSPAPromise(data.byok.openrouter, () => orpc.v1.byok.get()),
    },
  };
};
