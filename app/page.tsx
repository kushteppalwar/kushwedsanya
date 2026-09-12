import type { Metadata } from "next";
import { getEventConfig, getEventMeta, getDirectionsUrl } from "@/lib/content";
import { buildCalendarHref, ceremonyInstant } from "@/lib/calendar";
import Nav from "@/components/sections/Nav";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import Cities from "@/components/sections/Cities";
import Schedule from "@/components/sections/Schedule";
import Venue from "@/components/sections/Venue";
import Closing from "@/components/sections/Closing";

const config = getEventConfig("wedding")!;

export function generateMetadata(): Metadata {
  const meta = getEventMeta(config);
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, type: "website" },
  };
}

export default function Home() {
  const { couple, weddingDate, schedule = [], location, closing } = config;
  const ceremonies = schedule.flatMap((day) => day.events);
  const firstStart = ceremonies.find((event) => event.start)?.start;

  return (
    <>
      <Nav
        partner1={couple.partner1}
        partner2={couple.partner2}
        countdownTarget={firstStart && ceremonyInstant(firstStart)}
      />

      <main>
        <Hero
          tagline={weddingDate.tagline}
          partner1={couple.partner1}
          partner2={couple.partner2}
          dateDisplay={weddingDate.display}
          city1={couple.partner1City}
          city2={couple.partner2City}
          venue={location.venue}
        />

        <Marquee items={[...ceremonies.map((event) => event.name), location.venue ?? location.city]} />

        {couple.partner1City && couple.partner2City && (
          <Cities
            partner1={couple.partner1}
            partner2={couple.partner2}
            city1={couple.partner1City}
            city2={couple.partner2City}
            message={closing.message}
          />
        )}

        {schedule.length > 0 && <Schedule days={schedule} dateDisplay={weddingDate.display} />}

        <Venue
          location={location}
          dateDisplay={weddingDate.display}
          directionsUrl={getDirectionsUrl(location)}
          calendarHref={buildCalendarHref(config)}
          calendarFileName={`${couple.partner1}-${couple.partner2}-${config.eventName}.ics`.toLowerCase()}
        />
      </main>

      <Closing
        partner1={couple.partner1}
        partner2={couple.partner2}
        dateDisplay={weddingDate.display}
        signoff={closing.signoff}
      />
    </>
  );
}
