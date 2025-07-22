import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isSubscribed } from "../../../../src/lib/common/utils/subscription";
import type { UserInfo } from "../../../../src/lib/common/sharedTypes";
import type { SubscriptionStatus } from "../../../../src/lib/common";
import { sub } from "date-fns";

// Mock dates for consistent testing
const mockNow = new Date("2024-01-15T10:00:00Z");
const pastDate = new Date("2024-01-10T10:00:00Z");
const futureDate = new Date("2024-01-20T10:00:00Z");

let mockBillingEnabled: boolean;

vi.mock("../../../../src/lib/common/constants", () => ({
  get BILLING_ENABLED() {
    return mockBillingEnabled;
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(mockNow);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// Helper to create user objects
const createUser = (overrides: Partial<UserInfo> = {}): UserInfo => ({
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  profilePicture: null,
  emailVerified: true,
  subscribedUntil: null,
  subscriptionStatus: null,
  subscriptionPlan: null,
  ...overrides,
});

describe("isSubscribed", () => {
  describe("when billing is enabled", () => {
    beforeEach(() => {
      mockBillingEnabled = true;
    });

    it("should return false when user is null", () => {
      expect(isSubscribed(null)).toBe(false);
    });

    it("should return false when user has no subscription", () => {
      const user = createUser();
      expect(isSubscribed(user)).toBe(false);
    });

    it("should return false when subscribedUntil is null", () => {
      const user = createUser({
        subscriptionStatus: "active",
        subscriptionPlan: "unlimited",
      });
      expect(isSubscribed(user)).toBe(false);
    });

    it("should return false when subscriptionStatus is null", () => {
      const user = createUser({
        subscribedUntil: futureDate,
        subscriptionPlan: "unlimited",
      });
      expect(isSubscribed(user)).toBe(false);
    });

    it("should return false when subscription expired with active status", () => {
      const user = createUser({
        subscribedUntil: pastDate,
        subscriptionStatus: "active",
        subscriptionPlan: "unlimited",
      });
      expect(isSubscribed(user)).toBe(false);
    });

    it("should return true when subscription is active and not expired", () => {
      const user = createUser({
        subscribedUntil: futureDate,
        subscriptionStatus: "active",
        subscriptionPlan: "unlimited",
      });
      expect(isSubscribed(user)).toBe(true);
    });

    it("should return true when subscription is trialing and not expired", () => {
      const user = createUser({
        subscribedUntil: futureDate,
        subscriptionStatus: "trialing",
        subscriptionPlan: "unlimited",
      });
      expect(isSubscribed(user)).toBe(true);
    });

    // Test all inactive subscription statuses
    const inactiveStatuses: SubscriptionStatus[] = [
      "canceled",
      "incomplete",
      "incomplete_expired",
      "past_due",
      "paused",
      "unpaid",
    ];

    inactiveStatuses.forEach((status) => {
      it(`should return false when subscription is ${status} even if not expired`, () => {
        const user = createUser({
          subscribedUntil: futureDate,
          subscriptionStatus: status,
          subscriptionPlan: "unlimited",
        });
        expect(isSubscribed(user)).toBe(false);
      });
    });

    it("should return false when subscription is exactly at expiry time", () => {
      const user = createUser({
        subscribedUntil: mockNow,
        subscriptionStatus: "active",
        subscriptionPlan: "unlimited",
      });
      expect(isSubscribed(user)).toBe(false);
    });

    it("should return true when subscription expires one millisecond in the future", () => {
      const oneMsInFuture = new Date(mockNow.getTime() + 1);
      const user = createUser({
        subscribedUntil: oneMsInFuture,
        subscriptionStatus: "active",
        subscriptionPlan: "unlimited",
      });
      expect(isSubscribed(user)).toBe(true);
    });

    it("should return false when subscription expired one second ago", () => {
      const oneSecondInPast = sub(mockNow, { seconds: 1 });
      const user = createUser({
        subscribedUntil: oneSecondInPast,
        subscriptionStatus: "active",
        subscriptionPlan: "unlimited",
      });
      expect(isSubscribed(user)).toBe(false);
    });
  });

  describe("when billing is disabled", () => {
    beforeEach(() => {
      mockBillingEnabled = false;
    });

    it("should return true when user is null and bypassBillingDisabled is true (default)", () => {
      expect(isSubscribed(null)).toBe(true);
    });

    it("should return false when user is null and bypassBillingDisabled is false", () => {
      expect(isSubscribed(null, false)).toBe(false);
    });

    it("should return true for any user when bypassBillingDisabled is true (default)", () => {
      const user = createUser(); // No subscription
      expect(isSubscribed(user)).toBe(true);
    });

    it("should return false for unsubscribed user when bypassBillingDisabled is false", () => {
      const user = createUser(); // No subscription
      expect(isSubscribed(user, false)).toBe(false);
    });

    it("should return true for valid subscription even when bypassBillingDisabled is false", () => {
      const user = createUser({
        subscribedUntil: futureDate,
        subscriptionStatus: "active",
        subscriptionPlan: "unlimited",
      });
      expect(isSubscribed(user, false)).toBe(true);
    });
  });
});
