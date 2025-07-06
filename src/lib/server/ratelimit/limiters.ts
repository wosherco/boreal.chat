import { createRatelimit, Ratelimit } from "./client";

export const deepgramRatelimiter = createRatelimit("deepgram", Ratelimit.slidingWindow(10, "10m"));
