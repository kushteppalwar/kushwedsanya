import type { Metadata } from "next";
import { getEventConfig, getEventMeta, getDirectionsUrl } from "@/lib/content";
import { buildCalendarHref, ceremonyInstant } from "@/lib/calendar";
import { otherVersions } from "@/lib/versions";
import ScrollJourney from "@/components/v6/ScrollJourney";
import TwoStates from "@/components/v3/TwoStates";
import Destination from "@/components/v3/Destination";
import JourneyFooter from "@/components/v3/JourneyFooter";

const config = getEventConfig("wedding")!;

export function generateMetadata(): Metadata {
  const meta = getEventMeta(config);
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, type: "website" },
  };
}

export default function Version6() {
  const { couple, weddingDate, schedule = [], location, closing, journey } = config;
  const firstStart = schedule.flatMap((day) => day.events).find((event) => event.start)?.start;
  const calendarHref = buildCalendarHref(config);
  const calendarFileName = `${couple.partner1}-${couple.partner2}-${config.eventName}.ics`.toLowerCase();

  return (
    <div className="journey-day min-h-svh bg-(--jm-bg) font-sans text-(--jm-ink)">
      <main>
        <ScrollJourney
          config={config}
          directionsUrl={getDirectionsUrl(location)}
          calendarHref={calendarHref}
          calendarFileName={calendarFileName}
        />
        {journey && <TwoStates from={journey.from} to={journey.to} message={closing.message} />}
        <Destination
          location={location}
          dateDisplay={weddingDate.display}
          countdownTarget={firstStart && ceremonyInstant(firstStart)}
          directionsUrl={getDirectionsUrl(location)}
          calendarHref={calendarHref}
          calendarFileName={calendarFileName}
        />
      </main>
      <JourneyFooter
        partner1={couple.partner1}
        partner2={couple.partner2}
        signoff={closing.signoff}
        hashtag={config.hashtag}
        versions={otherVersions("/version6")}
      />
    </div>
  );
}
