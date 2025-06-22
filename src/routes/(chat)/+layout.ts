import { browser } from "$app/environment";
import type { LayoutLoad } from "./$types";
import { SIDEBAR_COLLAPSED_COOKIE } from "$lib/common/cookies";
import Cookies from "js-cookie";

export const load: LayoutLoad = async ({ data, params }) => {
  const sidebarCollapsed =
    data.sidebarCollapsed ?? (browser ? Cookies.get(SIDEBAR_COLLAPSED_COOKIE) === "true" : false);

  return {
    ...data,
    chatId: params.chatId,
    sidebarCollapsed,
  };
};
