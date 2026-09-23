import type { Metadata } from "next";
import { getEventConfig, getEventMeta, getDirectionsUrl } from "@/lib/content";
import { buildCalendarHref, ceremonyInstant } from "@/lib/calendar";
import { otherVersions } from "@/lib/versions";
import WorldJourneyStages from "@/components/v4-2/WorldJourneyStages";
import EventTimeline from "@/components/v13/EventTimeline";
import { timelineStops } from "@/lib/timeline";
import CountdownBand from "@/components/v4-2/CountdownBand";
import JourneyFooter from "@/components/v13/JourneyFooter";
import Loader from "@/components/v12/Loader";

const config = getEventConfig("wedding")!;
const reception = getEventConfig("reception");

export function generateMetadata(): Metadata {
  const meta = getEventMeta(config);
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
    },
  };
}

/**
 * Version 4.2: the version 4.1 journey as a run of explorable worlds. Each stop
 * is the version 4 flyover — drag to look around, watch the traveller go round
 * — and a Next button flies the camera to the next one, no scrolling required.
 * The timeline and a closing countdown follow below.
 */
export default function Version42() {
  const { couple, schedule = [], location, closing } = config;
  const events = schedule.flatMap((day) => day.events);
  // The countdown runs to the wedding ceremony itself, not the first event of the weekend
  const ceremony =
    events.find((event) => /wedding/i.test(event.name) && event.start) ??
    events.find((event) => event.start);
  const ceremonyDay = schedule.find((day) => day.events.includes(ceremony!));
  const calendarHref = buildCalendarHref(config);
  const calendarFileName =
    `${couple.partner1}-${couple.partner2}-${config.eventName}.ics`.toLowerCase();

  const stops = timelineStops(config, reception);

  return (
    <div className="journey-day min-h-svh overflow-x-clip bg-(--jm-bg) font-sans text-(--jm-ink)">
      <Loader
        partner1={couple.partner1}
        partner2={couple.partner2}
        hashtag={config.hashtag}
      />
      <main>
        <WorldJourneyStages
          config={config}
          reception={reception}
          directionsUrl={getDirectionsUrl(location)}
          receptionDirectionsUrl={
            reception && getDirectionsUrl(reception.location)
          }
          calendarHref={calendarHref}
          calendarFileName={calendarFileName}
        />
        {stops.length > 0 && (
          <EventTimeline
            stops={stops}
            title={`${stops.length} stops, one celebration`}
            note="Attire notes are only gentle suggestions — wear whatever you'll be happiest in."
          />
        )}
        {ceremony?.start && (
          <CountdownBand
            target={ceremonyInstant(ceremony.start)}
            until={`the ${ceremony.name.toLowerCase()}`}
            when={[ceremonyDay?.date, ceremony.time].filter(Boolean).join(" · ")}
          />
        )}
      </main>
      <JourneyFooter
        partner1={couple.partner1}
        partner2={couple.partner2}
        signoff={closing.signoff}
        hashtag={config.hashtag}
        versions={otherVersions("/version4-2")}
      />
    </div>
  );
}
