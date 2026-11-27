import type { IndonesianTimezone } from "./types";

export const DEFAULT_DEADLINE_TIMEZONE: IndonesianTimezone = "Asia/Jakarta";

export const DEADLINE_TIMEZONES: Array<{
  value: IndonesianTimezone;
  label: "WIB" | "WITA" | "WIT";
  offsetMinutes: number;
}> = [
  { value: "Asia/Jakarta", label: "WIB", offsetMinutes: 7 * 60 },
  { value: "Asia/Makassar", label: "WITA", offsetMinutes: 8 * 60 },
  { value: "Asia/Jayapura", label: "WIT", offsetMinutes: 9 * 60 },
];

function parseExactInstant(value: string | null | undefined) {
  if (!value || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) return null;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) ? instant : null;
}

export function getDeadlineTimezone(
  timezone: string | null | undefined,
): IndonesianTimezone {
  if (timezone === "WIB") return "Asia/Jakarta";
  if (timezone === "WITA") return "Asia/Makassar";
  if (timezone === "WIT") return "Asia/Jayapura";
  return (
    DEADLINE_TIMEZONES.find((item) => item.value === timezone)?.value ??
    DEFAULT_DEADLINE_TIMEZONE
  );
}

export function getDeadlineTimezoneLabel(timezone: string | null | undefined) {
  return (
    DEADLINE_TIMEZONES.find((item) => item.value === getDeadlineTimezone(timezone))
      ?.label ?? "WIB"
  );
}

export function localDeadlineToIso(
  localDateTime: string,
  timezone: string | null | undefined,
): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localDateTime);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const [year, month, day, hour, minute] = [
    yearText,
    monthText,
    dayText,
    hourText,
    minuteText,
  ].map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const roundTrip = new Date(localAsUtc);
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== month - 1 ||
    roundTrip.getUTCDate() !== day ||
    roundTrip.getUTCHours() !== hour ||
    roundTrip.getUTCMinutes() !== minute
  ) {
    return null;
  }

  const offsetMinutes =
    DEADLINE_TIMEZONES.find(
      (item) => item.value === getDeadlineTimezone(timezone),
    )?.offsetMinutes ?? 7 * 60;
  return new Date(localAsUtc - offsetMinutes * 60_000).toISOString();
}

export function deadlineInputValue(
  deadlineAt: string | null | undefined,
  timezone: string | null | undefined,
) {
  const instant = parseExactInstant(deadlineAt);
  if (!instant) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: getDeadlineTimezone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function deadlineLocalDate(
  deadlineAt: string | null | undefined,
  timezone: string | null | undefined,
) {
  const localValue = deadlineInputValue(deadlineAt, timezone);
  return localValue ? localValue.slice(0, 10) : null;
}

export function formatDeadlineAt(
  deadlineAt: string,
  timezone: string | null | undefined,
) {
  const instant = parseExactInstant(deadlineAt);
  if (!instant) return "Tenggat belum dikonfirmasi";
  const zone = getDeadlineTimezone(timezone);
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("id-ID", {
      timeZone: zone,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.day} ${values.month} ${values.year}, ${values.hour}:${values.minute} ${getDeadlineTimezoneLabel(zone)}`;
}

export function isDeadlineFuture(deadlineAt: string | null | undefined, now = new Date()) {
  const instant = parseExactInstant(deadlineAt);
  return Boolean(instant && instant.getTime() > now.getTime());
}

export function compareDeadlineInstants(
  leftDeadlineAt: string | null | undefined,
  rightDeadlineAt: string | null | undefined,
) {
  const leftInstant = parseExactInstant(leftDeadlineAt)?.getTime();
  const rightInstant = parseExactInstant(rightDeadlineAt)?.getTime();
  if (leftInstant === undefined) return rightInstant === undefined ? 0 : 1;
  if (rightInstant === undefined) return -1;
  return leftInstant - rightInstant;
}
