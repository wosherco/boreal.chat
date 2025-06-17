import type { CurrentUserInfo } from "$lib/common/sharedTypes";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  const currentUserInfo = (
    locals.user
      ? {
          authenticated: true,
          user: {
            id: locals.user.id,
            name: locals.user.name,
            email: locals.user.email,
            profilePicture: locals.user.profilePicture,
          },
        }
      : {
          authenticated: false,
        }
  ) satisfies CurrentUserInfo;
  return {
    ...currentUserInfo,
  };
};
