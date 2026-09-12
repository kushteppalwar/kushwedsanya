import Reveal from "@/components/animation/Reveal";
import { buttonBase } from "@/components/v2/InvitationCard";
import { Mandala } from "@/components/v2/Ornaments";
import type { EventLocation } from "@/lib/content";

interface VenueCardProps {
  location: EventLocation;
  dateDisplay: string;
  directionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

export default function VenueCard({
  location,
  dateDisplay,
  directionsUrl,
  calendarHref,
  calendarFileName,
}: VenueCardProps) {
  const place = [location.city, location.state, location.country].filter(Boolean).join(", ");

  return (
    <section className="relative overflow-hidden bg-rani px-4 py-24 text-cream-v2 sm:px-8 sm:py-32">
      <Mandala className="pointer-events-none absolute -top-40 -right-40 h-[32rem] w-[32rem] text-cream-v2/10" />
      <Mandala className="pointer-events-none absolute -bottom-52 -left-40 h-[36rem] w-[36rem] text-cream-v2/10" />

      <Reveal className="relative mx-auto max-w-2xl text-center">
        <p className="text-[0.7rem] tracking-[0.38em] text-cream-v2/70 uppercase sm:text-xs">The venue</p>
        <h2 className="mt-4 font-script text-[clamp(2.8rem,8vw,4.8rem)] leading-tight text-turmeric text-balance">
          {location.venue ?? location.city}
        </h2>
        <p className="mt-4 font-sans text-xl text-cream-v2/85 sm:text-2xl">{place}</p>
        <p className="mt-1 text-[0.72rem] tracking-[0.3em] text-cream-v2/60 uppercase sm:text-xs">{dateDisplay}</p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonBase} bg-turmeric text-cocoa shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] hover:bg-cream-v2`}
            >
              Get directions
              <span aria-hidden="true">↗</span>
            </a>
          )}
          {calendarHref && (
            <a
              href={calendarHref}
              download={calendarFileName}
              className={`${buttonBase} border border-cream-v2/50 text-cream-v2 hover:border-cream-v2 hover:bg-cream-v2/10`}
            >
              Add to calendar
            </a>
          )}
        </div>
      </Reveal>
    </section>
  );
}
