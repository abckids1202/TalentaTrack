import { describe, expect, it } from "vitest";
import { FIXTURE_OPPORTUNITIES } from "../src/lib/fixtures";
import { getReminderPreviews } from "../src/lib/reminders";

describe("getReminderPreviews", () => {
  it("schedules 7-day and 1-day previews at 09:00 in the selected timezone", () => {
    const previews = getReminderPreviews(
      FIXTURE_OPPORTUNITIES[0],
      "Asia/Jakarta",
      new Date("2026-12-01T00:00:00.000Z"),
    );

    expect(previews.map((item) => item.offsetDays)).toEqual([7, 1]);
    expect(previews[0].sendAt.toISOString()).toBe("2027-01-03T02:00:00.000Z");
    expect(previews[1].sendAt.toISOString()).toBe("2027-01-09T02:00:00.000Z");
  });

  it("skips reminder checkpoints that passed before the student saved", () => {
    const previews = getReminderPreviews(
      FIXTURE_OPPORTUNITIES[0],
      "Asia/Jakarta",
      new Date("2027-01-09T03:00:00.000Z"),
    );
    expect(previews).toEqual([]);
  });

  it("does not schedule reminders for rolling or undated listings", () => {
    const rolling = {
      ...FIXTURE_OPPORTUNITIES[0],
      deadlineKind: "rolling" as const,
      deadlineAt: null,
    };
    expect(getReminderPreviews(rolling, "Asia/Jakarta")).toEqual([]);
  });
});
