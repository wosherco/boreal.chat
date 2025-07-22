export * from "./limiters";

export function getRatelimitConsumeHeaders(remainingTokens?: number, nextRefillAt?: number) {
  const headers: Record<string, string> = {};

  if (remainingTokens !== undefined) {
    headers["X-RateLimit-Remaining"] = remainingTokens.toString();
  }

  if (nextRefillAt !== undefined) {
    headers["X-RateLimit-Reset"] = nextRefillAt.toString();
  }

  return headers;
}
