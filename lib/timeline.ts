import type { ScheduleDay } from "@/lib/content";

export interface TimelineStop {
  /** Group label shown on the line when it changes, e.g. "Day 1". */
  group: string;
  date: string;
  name: string;
  time?: string;
  venue?: string;
  city: string;
}

/** Flattens the wedding schedule (plus an optional reception) into timeline stops. */
export function timelineStops(
  days: ScheduleDay[],
  wedding: { venue?: string; city: string },
  reception?: { name: string; date: string; venue?: string; city: string },
): TimelineStop[] {
  const ceremonies = days.flatMap((day) =>
    day.events.map((event) => ({
      group: day.day,
      date: day.date ?? "",
      name: event.name,
      time: event.time,
      venue: wedding.venue,
      city: wedding.city,
    })),
  );
  return reception
    ? [
        ...ceremonies,
        {
          group: reception.name,
          date: reception.date,
          name: reception.name,
          venue: reception.venue,
          city: reception.city,
        },
      ]
    : ceremonies;
}
