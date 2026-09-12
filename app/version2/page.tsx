import type { Metadata } from "next";
import { getEventConfig, getEventMeta, getDirectionsUrl } from "@/lib/content";
import { buildCalendarHref, ceremonyInstant } from "@/lib/calendar";
import Petals from "@/components/v2/Petals";
import InvitationCard from "@/components/v2/InvitationCard";
import Celebrations from "@/components/v2/Celebrations";
import VenueCard from "@/components/v2/VenueCard";
import CountdownBlock from "@/components/v2/CountdownBlock";
import Footer from "@/components/v2/Footer";

const config = getEventConfig("wedding")!;

export function generateMetadata(): Metadata {
  const meta = getEventMeta(config);
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, type: "website" },
  };
}

export default function Version2() {
  const { couple, weddingDate, schedule = [], location, closing } = config;
  const firstStart = schedule.flatMap((day) => day.events).find((event) => event.start)?.start;
  const calendarHref = buildCalendarHref(config);
  const calendarFileName = `${couple.partner1}-${couple.partner2}-${config.eventName}.ics`.toLowerCase();

  return (
    <div className="relative min-h-svh bg-[radial-gradient(ellipse_at_top,var(--color-blush),var(--color-cream-v2)_55%)] font-sans text-cocoa">
      <Petals />

      <main className="relative z-10">
        <InvitationCard config={config} calendarHref={calendarHref} calendarFileName={calendarFileName} />

        {schedule.length > 0 && <Celebrations days={schedule} venue={location.venue} />}

        <VenueCard
          location={location}
          dateDisplay={weddingDate.display}
          directionsUrl={getDirectionsUrl(location)}
          calendarHref={calendarHref}
          calendarFileName={calendarFileName}
        />

        {firstStart && <CountdownBlock target={ceremonyInstant(firstStart)} />}

        <Footer
          partner1={couple.partner1}
          partner2={couple.partner2}
          message={closing.message}
          signoff={closing.signoff}
          hashtag={config.hashtag}
        />
      </main>
    </div>
  );
}
