import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ data }) => {
  // TODO: This check should be for SPA mode.
  if (!data.share) {
    throw error(404, "Not found");
  }

  return {
    share: data.share,
  };
};
