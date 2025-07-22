import { describe, it, expect } from "vitest";
import { constantTimeEquals } from "../../../../../src/lib/server/services/auth/utils";

// Helper to generate similar-length strings with subtle differences
function flipChar(str: string, idx: number): string {
  return str.slice(0, idx) + String.fromCharCode(str.charCodeAt(idx) ^ 1) + str.slice(idx + 1);
}

describe("constantTimeEquals", () => {
  it("returns true for identical strings", () => {
    expect(constantTimeEquals("abc123", "abc123")).toBe(true);
    expect(constantTimeEquals("", "")).toBe(true);
    expect(constantTimeEquals("a", "a")).toBe(true);
    expect(constantTimeEquals("😀😃😄", "😀😃😄")).toBe(true);
  });

  it("returns false for different strings of same length", () => {
    expect(constantTimeEquals("abc123", "abc124")).toBe(false);
    expect(constantTimeEquals("test", "tost")).toBe(false);
    expect(constantTimeEquals("😀😃😄", "😀😃😁")).toBe(false);
  });

  it("returns false for strings of different lengths", () => {
    expect(constantTimeEquals("abc", "ab")).toBe(false);
    expect(constantTimeEquals("", "a")).toBe(false);
    expect(constantTimeEquals("a", "")).toBe(false);
  });

  it("handles unicode and multi-byte characters", () => {
    expect(constantTimeEquals("café", "café")).toBe(true);
    expect(constantTimeEquals("café", "cafe")).toBe(false);
    expect(constantTimeEquals("💩", "💩")).toBe(true);
    expect(constantTimeEquals("💩", "💀")).toBe(false);
  });

  it("returns false for subtle differences", () => {
    const base = "a".repeat(100);
    const diff = flipChar(base, 50);
    expect(constantTimeEquals(base, diff)).toBe(false);
  });

  it("runs in roughly constant time for equal-length strings", () => {
    // This is a basic check: we just want to ensure the function doesn't exit early
    // and that it always iterates the full string length.
    const a = "x".repeat(1000);
    const b = "x".repeat(1000);
    const c = flipChar(b, 999);
    const start1 = performance.now();
    constantTimeEquals(a, b);
    const end1 = performance.now();
    const start2 = performance.now();
    constantTimeEquals(a, c);
    const end2 = performance.now();
    // The times should be similar (within a reasonable margin)
    const diff = Math.abs(end1 - start1 - (end2 - start2));
    expect(diff).toBeLessThan(2); // ms, not a strict test, just a sanity check
  });
});
