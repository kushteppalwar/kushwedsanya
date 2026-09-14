import weddingConfig from "@/config/wedding.json";
import receptionConfig from "@/config/reception.json";

export interface Attire {
  women?: string;
  men?: string;
  /** Guidance that applies to everyone. */
  all?: string;
}

export interface ScheduleEvent {
  name: string;
  time: string;
  /** Local start time in the venue's time zone, as "YYYY-MM-DDTHH:mm". */
  start?: string;
  /** Hall or spot within the venue. */
  hall?: string;
  /** Icon key when the event name doesn't map to one on its own. */
  icon?: string;
  /** Suggested (never required) dress code. */
  attire?: Attire;
}

export interface ScheduleDay {
  day: string;
  date?: string;
  events: ScheduleEvent[];
}

export interface EventLocation {
  venue?: string;
  city: string;
  state?: string;
  country: string;
}

export interface MapPlace {
  city: string;
  state: string;
  lat: number;
  lon: number;
}

export interface JourneyStop extends MapPlace {
  person: string;
  /** Airport code, shown on travel-document styled versions. */
  code?: string;
}

export interface EventConfig {
  eventName: string;
  hashtag?: string;
  journey?: {
    from: JourneyStop;
    to: JourneyStop;
    /** Cities guests are likely travelling from, for the many-to-one maps. */
    guestOrigins?: MapPlace[];
  };
  invitation?: {
    intro: string;
    request: string;
  };
  couple: {
    partner1: string;
    partner2: string;
    partner1City?: string;
    partner2City?: string;
  };
  weddingDate: {
    display: string;
    startDay: string;
    endDay?: string;
    month: string;
    year: string;
    dayOfWeek: string;
    tagline: string;
  };
  schedule?: ScheduleDay[];
  location: EventLocation;
  closing: {
    message: string;
    signoff: string;
  };
}

const events: Record<string, EventConfig> = {
  wedding: weddingConfig,
  reception: receptionConfig,
};

export const eventSlugs = Object.keys(events);

export function getEventConfig(slug: string): EventConfig | undefined {
  return events[slug];
}

export function formatPlace(location: EventLocation) {
  return [location.venue, location.city, location.country].filter(Boolean).join(", ");
}

export function getEventMeta(config: EventConfig) {
  const { couple, eventName, weddingDate, location } = config;
  const names = `${couple.partner1} & ${couple.partner2}`;
  return {
    title: `${names} — ${eventName} Invitation`,
    description: `You are invited to the ${eventName.toLowerCase()} of ${names} on ${weddingDate.display} at ${formatPlace(location)}.`,
  };
}

export function getDirectionsUrl(location: EventLocation) {
  if (!location.venue) return undefined;
  const query = encodeURIComponent(formatPlace(location));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
