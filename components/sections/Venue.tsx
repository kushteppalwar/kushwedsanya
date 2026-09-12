import Reveal from "@/components/animation/Reveal";
import type { EventLocation } from "@/lib/content";

interface VenueProps {
  location: EventLocation;
  dateDisplay: string;
  directionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

const button =
  "inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3 text-xs tracking-[0.25em] uppercase transition-colors sm:text-sm";

export default function Venue({
  location,
  dateDisplay,
  directionsUrl,
  calendarHref,
  calendarFileName,
}: VenueProps) {
  const place = [location.city, location.state, location.country].filter(Boolean).join(", ");

  return (
    <section id="venue" className="grain relative scroll-mt-16 overflow-hidden bg-ink text-paper">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 sm:py-36 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end">
        <Reveal>
          <p className="text-[0.68rem] tracking-[0.35em] text-paper/60 uppercase sm:text-xs">Venue</p>
          <h2 className="mt-4 font-serif text-[clamp(2.6rem,8vw,7rem)] leading-[0.95] font-light tracking-[-0.02em] text-balance">
            {location.venue ?? location.city}
          </h2>
          <p className="mt-6 font-sans text-xl text-paper/70 sm:text-2xl">
            {place}
            <span className="mx-3 text-brass" aria-hidden="true">
              ·
            </span>
            {dateDisplay}
          </p>
        </Reveal>

        <Reveal delay={0.15} className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${button} bg-brass text-ink hover:bg-paper`}
            >
              Get directions
              <span aria-hidden="true">↗</span>
            </a>
          )}
          {calendarHref && (
            <a
              href={calendarHref}
              download={calendarFileName}
              className={`${button} border border-paper/40 text-paper hover:border-paper hover:bg-paper/10`}
            >
              Add to calendar
            </a>
          )}
        </Reveal>
      </div>
    </section>
  );
}
