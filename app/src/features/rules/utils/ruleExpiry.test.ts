import { describe, expect, it } from "vitest";
import { formatTimeLeft, getPendingExpiry } from "./ruleExpiry";

const MINUTE = 60 * 1000;

describe("rule expiry helpers", () => {
  it("formats the time left, rounding up", () => {
    expect(formatTimeLeft(1000)).toBe("1 min");
    expect(formatTimeLeft(15 * MINUTE)).toBe("15 min");
    expect(formatTimeLeft(60 * MINUTE)).toBe("1 h");
    expect(formatTimeLeft(190 * MINUTE)).toBe("3 h 10 min");
    expect(formatTimeLeft(24 * 60 * MINUTE)).toBe("1 day");
    expect(formatTimeLeft(3 * 24 * 60 * MINUTE)).toBe("3 days");
  });

  it("only reports a timer that is still pending", () => {
    expect(getPendingExpiry({ expiresAt: 2000 }, 1000)).toBe(2000);
    expect(getPendingExpiry({ expiresAt: 1000 }, 1000)).toBeNull();
    expect(getPendingExpiry({}, 1000)).toBeNull();
    expect(getPendingExpiry(undefined, 1000)).toBeNull();
  });
});
