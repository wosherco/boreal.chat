import { error } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import { BILLING_ENABLED } from "$lib/common/constants";

export const load: LayoutLoad = () => {
  if (!BILLING_ENABLED) {
    throw error(404, "Billing is not enabled");
  }
};
