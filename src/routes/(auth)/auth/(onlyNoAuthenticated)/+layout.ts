import { redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ parent }) => {
  const data = await parent();

  if (data?.auth.currentUserInfo?.authenticated) {
    return redirect(302, "/");
  }

  return data;
};
