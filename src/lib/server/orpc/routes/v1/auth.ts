import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import { invalidateSession, sessionCookieName } from "$lib/server/auth";
import type { CurrentUserInfo } from "$lib/common/sharedTypes";

export const v1AuthRouter = osBase.router({
  getUser: osBase.handler(async ({ context }) => {
    const user = context.userCtx.user;
    if (!user) {
      return {
        authenticated: false,
        data: null,
      };
    }
    return {
      authenticated: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    } satisfies CurrentUserInfo;
  }),
  logout: osBase.use(authenticatedMiddleware).handler(async ({ context }) => {
    await invalidateSession(context.userCtx.session.id);
    context.cookies?.delete(sessionCookieName, { path: "/" });
    return { success: true };
  }),
});
