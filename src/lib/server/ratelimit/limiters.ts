import { createRatelimit, Ratelimit } from "./client";

export const transcribeRatelimiter = createRatelimit(
  "transcribe",
  Ratelimit.slidingWindow(10, "10m"),
);
