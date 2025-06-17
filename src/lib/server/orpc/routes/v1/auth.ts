import { z } from "zod";
import { osBase } from "../../context";
import { authenticatedMiddleware } from "../../middlewares";

export const v1AuthRouter = osBase.router({
  getUser: osBase.use(authenticatedMiddleware).handler(async ({ context }) => {
    return {
      id: context.userCtx.user.id,
      name: context.userCtx.user.name,
    };
  }),
});
