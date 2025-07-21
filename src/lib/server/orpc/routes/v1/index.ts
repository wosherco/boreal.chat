import { v1ChatRouter } from "./chat";
import { v1ByokRouter } from "./byok";
import { v1AuthRouter } from "./auth";
import { v1ShareRouter } from "./share";
import { v1BillingRouter } from "./billing";
import { v1DraftRouter } from "./draft";
import { v1VoiceRouter } from "./voice";
import { v1MCPRouter } from "./mcp";

export const v1Router = {
  chat: v1ChatRouter,
  byok: v1ByokRouter,
  auth: v1AuthRouter,
  share: v1ShareRouter,
  billing: v1BillingRouter,
  draft: v1DraftRouter,
  voice: v1VoiceRouter,
  mcp: v1MCPRouter,
};
