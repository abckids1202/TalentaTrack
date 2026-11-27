import type { Opportunity, ReminderPreview } from "./types";
import { deadlineLocalDate, getDeadlineTimezone } from "./deadlines";

function dateAtLocalHour(dateString: string, timezone: string, hour: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hourCycle: "h23",
  });
  const displayedHour = Number(formatter.format(utcGuess));
  const correction = (displayedHour - hour + 24) % 24;
  return new Date(utcGuess.getTime() - correction * 60 * 60 * 1000);
}

export function getReminderPreviews(
  opportunity: Opportunity,
  timezone: string,
  savedAt = new Date(),
): ReminderPreview[] {
  if (opportunity.deadlineKind !== "fixed" || !opportunity.deadlineAt) {
    return [];
  }
  const localDate = deadlineLocalDate(
    opportunity.deadlineAt,
    getDeadlineTimezone(opportunity.deadlineTimezone),
  );
  if (!localDate) return [];
  return ([7, 1] as const)
    .map((offsetDays) => {
      const due = new Date(localDate + "T00:00:00Z");
      due.setUTCDate(due.getUTCDate() - offsetDays);
      const dateString = due.toISOString().slice(0, 10);
      return {
        offsetDays,
        sendAt: dateAtLocalHour(dateString, timezone, 9),
      };
    })
    .filter((reminder) => reminder.sendAt.getTime() > savedAt.getTime());
}
