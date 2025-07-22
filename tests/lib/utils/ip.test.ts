import { describe, it, expect } from "vitest";
import { getClientIp } from "../../../src/lib/server/utils/ip";

describe("getClientIp", () => {
  function makeHeaders(map: Record<string, string | undefined>): Headers {
    // Filter out undefined values to satisfy HeadersInit typing
    return new Headers(
      Object.entries(map).filter(([, v]) => v !== undefined) as [string, string][],
    );
  }

  it("returns the first IP from x-forwarded-for if present", () => {
    const headers = makeHeaders({
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      "x-real-ip": "9.9.9.9",
      "cf-connecting-ip": "8.8.8.8",
    });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("returns trimmed IP from x-forwarded-for", () => {
    const headers = makeHeaders({
      "x-forwarded-for": "  2.2.2.2  ",
    });
    expect(getClientIp(headers)).toBe("2.2.2.2");
  });

  it("returns x-real-ip if x-forwarded-for is missing", () => {
    const headers = makeHeaders({
      "x-real-ip": "3.3.3.3",
    });
    expect(getClientIp(headers)).toBe("3.3.3.3");
  });

  it("returns cf-connecting-ip if others are missing", () => {
    const headers = makeHeaders({
      "cf-connecting-ip": "4.4.4.4",
    });
    expect(getClientIp(headers)).toBe("4.4.4.4");
  });

  it("returns undefined if no relevant headers are present", () => {
    const headers = makeHeaders({});
    expect(getClientIp(headers)).toBeNull();
  });
});
