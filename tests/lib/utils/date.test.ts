import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatDateCompact } from "../../../src/lib/utils/date";

// Mock current time for consistent testing
const mockNow = new Date("2024-01-15T14:30:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(mockNow);
  process.env.TZ = "UTC";
});

afterEach(() => {
  vi.useRealTimers();
  delete process.env.TZ;
});

describe("formatDateCompact", () => {
  it("should format date string in 24-hour format", () => {
    const dateString = "2024-01-15T10:30:00Z";
    const result = formatDateCompact(dateString);

    expect(result).toBe("Jan 15, 10:30");
  });

  it("should handle PM times in 24-hour format", () => {
    const dateString = "2024-01-15T22:45:00Z";
    const result = formatDateCompact(dateString);

    expect(result).toBe("Jan 15, 22:45");
  });

  it("should handle midnight in 24-hour format", () => {
    const dateString = "2024-01-15T00:00:00Z";
    const result = formatDateCompact(dateString);

    expect(result).toBe("Jan 15, 00:00");
  });

  it("should handle noon in 24-hour format", () => {
    const dateString = "2024-01-15T12:00:00Z";
    const result = formatDateCompact(dateString);

    expect(result).toBe("Jan 15, 12:00");
  });
});
