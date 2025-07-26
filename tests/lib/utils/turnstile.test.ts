import { describe, it, expect, beforeEach, vi, afterAll, beforeAll } from "vitest";
import createFetchMock from "vitest-fetch-mock";
import { verifyTurnstileToken } from "../../../src/lib/server/utils/turnstile";

const fetchMock = createFetchMock(vi);

describe("verifyTurnstileToken", () => {
  const token = "dummy-token";
  const ip = "127.0.0.1";

  beforeAll(() => {
    fetchMock.enableMocks();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterAll(() => {
    fetchMock.dontMock();
  });

  it("returns true for a successful response", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }));
    const result = await verifyTurnstileToken(token, ip);
    expect(result).toBe(true);
  });

  it("returns false for an unsuccessful response", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ success: false }));
    const result = await verifyTurnstileToken(token, ip);
    expect(result).toBe(false);
  });

  it("returns false for a malformed response", async () => {
    fetchMock.mockResponseOnce(JSON.stringify({})); // missing 'success'
    const result = await verifyTurnstileToken(token, ip);
    expect(result).toBe(false);
  });
});
