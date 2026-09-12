import type { Metadata } from "next";
import { getEventConfig, getEventMeta, getDirectionsUrl } from "@/lib/content";
import { buildCalendarHref, ceremonyInstant } from "@/lib/calendar";
import { otherVersions } from "@/lib/versions";
import BoardingPass from "@/components/v5/BoardingPass";
import StampedItinerary from "@/components/v5/StampedItinerary";
import PostcardMap from "@/components/v5/PostcardMap";
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

export default function Version5() {
  const { couple, weddingDate, schedule = [], location, closing, journey } = config;
  const firstStart = schedule.flatMap((day) => day.events).find((event) => event.start)?.start;
  const calendarHref = buildCalendarHref(config);
  const calendarFileName = `${couple.partner1}-${couple.partner2}-${config.eventName}.ics`.toLowerCase();

  return (
    <div className="journey-day min-h-svh bg-(--jm-bg) font-sans text-(--jm-ink)">
      <main>
        <BoardingPass config={config} calendarHref={calendarHref} calendarFileName={calendarFileName} />
        {schedule.length > 0 && (
          <StampedItinerary days={schedule} year={weddingDate.year} destination={location.city} />
        )}
        {journey && (
          <PostcardMap
            from={journey.from}
            to={journey.to}
            message={closing.message}
            signoff={closing.signoff}
            partner1={couple.partner1}
            partner2={couple.partner2}
          />
        )}
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
        versions={otherVersions("/version5")}
      />
    </div>
  );
}
