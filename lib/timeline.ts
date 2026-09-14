import type { Attire, EventConfig, ScheduleDay } from "@/lib/content";

export interface TimelineStop {
  /** Group label shown on the line when it changes, e.g. "Day 1". */
  group: string;
  date: string;
  name: string;
  icon?: string;
  time?: string;
  /** Hall or spot within the venue. */
  hall?: string;
  venue?: string;
  city: string;
  attire?: Attire;
}

function stopsOf(days: ScheduleDay[], location: { venue?: string; city: string }): TimelineStop[] {
  return days.flatMap((day) =>
    day.events.map((event) => ({
      group: day.day,
      date: day.date ?? "",
      name: event.name,
      icon: event.icon,
      time: event.time,
      hall: event.hall,
      venue: location.venue,
      city: location.city,
      attire: event.attire,
    })),
  );
}

/** Flattens the wedding schedule, followed by the reception's, into timeline stops. */
export function timelineStops(wedding: EventConfig, reception?: EventConfig): TimelineStop[] {
  const stops = stopsOf(wedding.schedule ?? [], wedding.location);
  if (!reception) return stops;
  const receptionStops = reception.schedule?.length
    ? stopsOf(reception.schedule, reception.location)
    : [
        {
          group: reception.eventName,
          date: reception.weddingDate.display,
          name: reception.eventName,
          venue: reception.location.venue,
          city: reception.location.city,
        },
      ];
  return [...stops, ...receptionStops];
}
