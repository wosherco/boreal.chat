import { z } from "zod";
import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";
import {
  invalidateSession,
  sessionCookieName,
} from "$lib/server/auth";

export const v1AuthRouter = osBase.router({
  getUser: osBase.use(authenticatedMiddleware).handler(async ({ context }) => {
    return {
      id: context.userCtx.user.id,
      name: context.userCtx.user.name,
    };
  }),
  logout: osBase.use(authenticatedMiddleware).handler(async ({ context }) => {
    await invalidateSession(context.userCtx.session.id);
    context.cookies?.delete(sessionCookieName, { path: "/" });
    return { success: true };
  }),
});
