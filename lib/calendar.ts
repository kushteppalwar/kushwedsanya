import { formatPlace, type EventConfig } from "@/lib/content";

// India Standard Time has no daylight saving, so a fixed offset is exact.
const VENUE_UTC_OFFSET = "+05:30";
const CEREMONY_DURATION_MS = 2 * 60 * 60 * 1000;

/** Turns a config start time ("YYYY-MM-DDTHH:mm", venue-local) into an absolute ISO instant. */
export function ceremonyInstant(start: string) {
  return `${start}:00${VENUE_UTC_OFFSET}`;
}

function toIcsUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** A data: URI for an .ics file with one entry per ceremony that has a start time. */
export function buildCalendarHref(config: EventConfig) {
  const ceremonies = (config.schedule ?? [])
    .flatMap((day) => day.events)
    .filter((event): event is typeof event & { start: string } => Boolean(event.start));
  if (ceremonies.length === 0) return undefined;

  const names = `${config.couple.partner1} & ${config.couple.partner2}`;
  const location = escapeText(formatPlace(config.location));
  const stamp = toIcsUtc(new Date());

  const entries = ceremonies.flatMap((event) => {
    const start = new Date(ceremonyInstant(event.start));
    const end = new Date(start.getTime() + CEREMONY_DURATION_MS);
    return [
      "BEGIN:VEVENT",
      `UID:${event.start}-${event.name.toLowerCase()}@${names.replace(/\W+/g, "-").toLowerCase()}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toIcsUtc(start)}`,
      `DTEND:${toIcsUtc(end)}`,
      `SUMMARY:${escapeText(`${event.name} — ${names}`)}`,
      `LOCATION:${location}`,
      "END:VEVENT",
    ];
  });

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${names}//${config.eventName}//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...entries,
    "END:VCALENDAR",
  ];

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}
