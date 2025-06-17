import { v1ChatRouter } from "./chat";
import { v1ByokRouter } from "./byok";
import { v1AuthRouter } from "./auth";

export const v1Router = {
  chat: v1ChatRouter,
  byok: v1ByokRouter,
  auth: v1AuthRouter,
};
