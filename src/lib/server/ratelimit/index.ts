export * from "./limiters";

export function getRatelimitConsumeHeaders(remainingTokens?: number, nextRefillAt?: number) {
  const headers: Record<string, string> = {};

  if (remainingTokens) {
    headers["X-RateLimit-Remaining"] = remainingTokens.toString();
  }

  if (nextRefillAt) {
    headers["X-RateLimit-Reset"] = nextRefillAt.toString();
  }

  return headers;
}
