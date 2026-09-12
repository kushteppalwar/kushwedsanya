import weddingConfig from "@/config/wedding.json";
import receptionConfig from "@/config/reception.json";

export interface EventConfig {
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
  location: {
    venue?: string;
    city: string;
    state: string;
    country: string;
  };
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

export function getEventMeta(config: EventConfig) {
  const { couple, weddingDate, location } = config;
  return {
    title: `${couple.partner1} & ${couple.partner2} — Save the Date`,
    description: `Join us as ${couple.partner1} & ${couple.partner2} celebrate their wedding on ${weddingDate.display} in ${location.city}, ${location.state}.`,
  };
}
