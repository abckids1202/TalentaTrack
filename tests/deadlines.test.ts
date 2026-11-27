import { describe, expect, it } from "vitest";
import {
  DEFAULT_DEADLINE_TIMEZONE,
  compareDeadlineInstants,
  formatDeadlineAt,
  getDeadlineTimezone,
  isDeadlineFuture,
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

  it("uses the exact WIB, WITA, and WIT cutoffs for same-day deadline checks", () => {
    const cases = [
      { zone: "WIB", cutoff: "2027-01-10T16:59:00.000Z", label: "WIB" },
      { zone: "WITA", cutoff: "2027-01-10T15:59:00.000Z", label: "WITA" },
      { zone: "WIT", cutoff: "2027-01-10T14:59:00.000Z", label: "WIT" },
    ] as const;

    for (const { zone, cutoff, label } of cases) {
      const deadlineAt = localDeadlineToIso("2027-01-10T23:59", zone);
      expect(deadlineAt).toBe(cutoff);
      expect(formatDeadlineAt(deadlineAt!, zone)).toContain("23:59 " + label);
      expect(
        isDeadlineFuture(
          deadlineAt,
          new Date(new Date(cutoff).getTime() - 1),
        ),
      ).toBe(true);
      expect(isDeadlineFuture(deadlineAt, new Date(cutoff))).toBe(false);
    }
  });

  it("orders timestamps by their represented instant even when offsets differ", () => {
    expect(
      compareDeadlineInstants(
        "2027-01-10T16:00:00.000Z",
        "2027-01-10T23:59:00+09:00",
      ),
    ).toBeGreaterThan(0);
  });
});
