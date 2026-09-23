import type { Metadata } from "next";
import { getEventConfig, getEventMeta, getDirectionsUrl } from "@/lib/content";
import { buildCalendarHref } from "@/lib/calendar";
import { otherVersions } from "@/lib/versions";
import GardenGate from "@/components/v14/GardenGate";
import WelcomeScene from "@/components/v14/WelcomeScene";
import CoupleScene from "@/components/v14/CoupleScene";
import EventScene from "@/components/v14/EventScene";
import RSVPScene from "@/components/v14/RSVPScene";
import GardenFooter from "@/components/v14/GardenFooter";
import Petals from "@/components/v2/Petals";

const config = getEventConfig("wedding")!;

export function generateMetadata(): Metadata {
  const meta = getEventMeta(config);
  return {
    title: meta.title,
    description: meta.description,
    openGraph: { title: meta.title, description: meta.description, type: "website" },
  };
}

/**
 * Version 14 — "Ivory Garden": a gate that parts on a tap, then one arched
 * garden scene per beat (welcome, the couple, each ceremony, RSVP), styled
 * after the premium digital-invitation sites — but drawn in this project's
 * own line-art (Ornaments.tsx) rather than borrowed photoreal artwork.
 */
export default function Version14() {
  const { couple, invitation, schedule = [], location, closing } = config;
  const calendarHref = buildCalendarHref(config);
  const calendarFileName = `${couple.partner1}-${couple.partner2}-${config.eventName}.ics`.toLowerCase();

  const events = schedule.flatMap((day) =>
    day.events.map((event) => ({ event, date: day.date })),
  );

  return (
    <div className="min-h-svh bg-cream-v2 font-sans text-cocoa">
      <GardenGate partner1={couple.partner1} partner2={couple.partner2} />
      <Petals />

      <main className="relative z-10">
        <WelcomeScene
          partner1={couple.partner1}
          partner2={couple.partner2}
          intro={invitation?.intro}
          request={invitation?.request}
        />

        <CoupleScene
          config={config}
          directionsUrl={getDirectionsUrl(location)}
          calendarHref={calendarHref}
          calendarFileName={calendarFileName}
        />

        {events.map(({ event, date }, index) => (
          <EventScene key={`${event.name}-${index}`} event={event} date={date} index={index} />
        ))}

        <RSVPScene message={closing.message} />
      </main>

      <GardenFooter
        partner1={couple.partner1}
        partner2={couple.partner2}
        signoff={closing.signoff}
        hashtag={config.hashtag}
        versions={otherVersions("/version14")}
      />
    </div>
  );
}
