import { v1Router } from "./routes/v1";
import { osBase } from "./context";

export const appRouter = osBase.router({
  v1: v1Router,
});
