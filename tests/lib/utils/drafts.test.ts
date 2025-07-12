import { describe, it, expect } from "vitest";
import { getDraftIdFromUrl } from "../../../src/lib/utils/drafts";

describe("getDraftIdFromUrl", () => {
  it("should return draft ID when draft parameter exists", () => {
    const url = new URL("https://example.com/path?draft=123");
    const result = getDraftIdFromUrl(url);

    expect(result).toBe("123");
  });

  it("should return null when draft parameter does not exist", () => {
    const url = new URL("https://example.com/path");
    const result = getDraftIdFromUrl(url);

    expect(result).toBe(null);
  });

  it("should return null when draft parameter does not exist among other parameters", () => {
    const url = new URL("https://example.com/path?param1=value1&param2=value2");
    const result = getDraftIdFromUrl(url);

    expect(result).toBe(null);
  });

  it("should return draft ID when it exists among other parameters", () => {
    const url = new URL("https://example.com/path?param1=value1&draft=456&param2=value2");
    const result = getDraftIdFromUrl(url);

    expect(result).toBe("456");
  });

  it("should return empty string when draft parameter is empty", () => {
    const url = new URL("https://example.com/path?draft=");
    const result = getDraftIdFromUrl(url);

    expect(result).toBe("");
  });

  it("should return draft ID with special characters", () => {
    const url = new URL("https://example.com/path?draft=abc-123_def");
    const result = getDraftIdFromUrl(url);

    expect(result).toBe("abc-123_def");
  });

  it("should return draft ID with UUID format", () => {
    const draftId = "550e8400-e29b-41d4-a716-446655440000";
    const url = new URL(`https://example.com/path?draft=${draftId}`);
    const result = getDraftIdFromUrl(url);

    expect(result).toBe(draftId);
  });

  it("should return draft ID with encoded characters", () => {
    const url = new URL("https://example.com/path?draft=test%20value");
    const result = getDraftIdFromUrl(url);

    expect(result).toBe("test value");
  });

  it("should return first value when draft parameter appears multiple times", () => {
    const url = new URL("https://example.com/path?draft=first&draft=second");
    const result = getDraftIdFromUrl(url);

    expect(result).toBe("first");
  });

  it("should return draft ID with numeric value", () => {
    const url = new URL("https://example.com/path?draft=42");
    const result = getDraftIdFromUrl(url);

    expect(result).toBe("42");
  });

  it("should return draft ID with long value", () => {
    const longValue = "a".repeat(100);
    const url = new URL(`https://example.com/path?draft=${longValue}`);
    const result = getDraftIdFromUrl(url);

    expect(result).toBe(longValue);
  });

  it("should handle case-sensitive parameter names", () => {
    const url = new URL("https://example.com/path?Draft=123&DRAFT=456");
    const result = getDraftIdFromUrl(url);

    expect(result).toBe(null); // 'draft' is case-sensitive
  });

  it("should return draft ID from complex URL", () => {
    const url = new URL(
      "https://example.com:8080/path/to/page?param1=value1&draft=complex-draft-id&param2=value2#fragment",
    );
    const result = getDraftIdFromUrl(url);

    expect(result).toBe("complex-draft-id");
  });
});
