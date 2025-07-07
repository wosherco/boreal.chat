import { env } from "$env/dynamic/public";
import { Flagsmith } from "flagsmith-nodejs";

export const flagsmith = env.PUBLIC_FLAGSMITH_ENVIRONMENT_KEY
  ? new Flagsmith({
      environmentKey: env.PUBLIC_FLAGSMITH_ENVIRONMENT_KEY,
      apiUrl: env.PUBLIC_FLAGSMITH_API_URL || "https://edge.api.flagsmith.com/api/v1/",
      retries: 3,
    })
  : null;