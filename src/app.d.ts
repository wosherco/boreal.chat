import { ExecutionContext } from "@cloudflare/workers-types";

// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      user: import("$lib/server/auth").SessionValidationResult["user"];
      session: import("$lib/server/auth").SessionValidationResult["session"];
      flagsmithFlags: Record<string, any> | null;
    }
    interface Platform {
      /**
       * If undefined, we're not running on cf workers.
       */
      ctx?: ExecutionContext;
    }
  }
}

export {};
