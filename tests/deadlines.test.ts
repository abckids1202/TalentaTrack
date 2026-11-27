import { describe, expect, it } from "vitest";
import {
  DEFAULT_DEADLINE_TIMEZONE,
  formatDeadlineAt,
  getDeadlineTimezone,
  localDeadlineToIso,
} from "../src/lib/deadlines";

describe("deadline timestamp conversion", () => {
  it("uses Asia/Jakarta when a source only identifies WIB or has no zone", () => {
    expect(getDeadlineTimezone("WIB")).toBe(DEFAULT_DEADLINE_TIMEZONE);
    expect(getDeadlineTimezone(null)).toBe(DEFAULT_DEADLINE_TIMEZONE);
    expect(getDeadlineTimezone("WITA")).toBe("Asia/Makassar");
    expect(getDeadlineTimezone("WIT")).toBe("Asia/Jayapura");
  });

  it("converts a WIB deadline to an exact instant and labels it WIB", () => {
    const deadlineAt = localDeadlineToIso("2027-01-10T23:59", "Asia/Jakarta");
    expect(deadlineAt).toBe("2027-01-10T16:59:00.000Z");
    expect(formatDeadlineAt(deadlineAt!, "Asia/Jakarta")).toContain("23:59 WIB");
  });

  it("converts a WITA deadline to an exact instant and labels it WITA", () => {
    const deadlineAt = localDeadlineToIso("2027-01-10T23:59", "WITA");
    expect(deadlineAt).toBe("2027-01-10T15:59:00.000Z");
    expect(formatDeadlineAt(deadlineAt!, "WITA")).toContain("23:59 WITA");
  });

  it("converts a WIT deadline to an exact instant and labels it WIT", () => {
    const deadlineAt = localDeadlineToIso("2027-01-10T23:59", "WIT");
    expect(deadlineAt).toBe("2027-01-10T14:59:00.000Z");
    expect(formatDeadlineAt(deadlineAt!, "WIT")).toContain("23:59 WIT");
  });
});
