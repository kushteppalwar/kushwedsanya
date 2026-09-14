import Reveal from "@/components/animation/Reveal";
import Countdown from "@/components/v13/Countdown";
import { buttonOutline, buttonPrimary, label } from "@/components/v13/styles";
import type { EventLocation } from "@/lib/content";

interface DestinationProps {
  location: EventLocation;
  dateDisplay: string;
  countdown?: { target: string; until: string; when: string };
  directionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

export default function Destination({
  location,
  dateDisplay,
  countdown,
  directionsUrl,
  calendarHref,
  calendarFileName,
}: DestinationProps) {
  const place = [location.city, location.state, location.country]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <Reveal>
        <div className="grid overflow-hidden rounded-[2rem] border border-(--jm-line) bg-(--jm-card) lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="p-8 sm:p-12">
            <p className={label}>Destination</p>
            <h2 className="mt-4 font-serif text-[clamp(2.2rem,6vw,4.2rem)] leading-[0.98] text-(--jm-ink) text-balance">
              {location.venue ?? location.city}
            </h2>
            <p className="mt-4 font-sans text-xl font-medium text-(--jm-muted) sm:text-2xl">
              {place}
            </p>
            <p className={`mt-1.5 ${label}`}>{dateDisplay}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonPrimary}
                >
                  Get directions
                  <span aria-hidden="true">↗</span>
                </a>
              )}
              {calendarHref && (
                <a
                  href={calendarHref}
                  download={calendarFileName}
                  className={buttonOutline}
                >
                  Add to calendar
                </a>
              )}
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center gap-4 border-t border-(--jm-line) bg-(--jm-accent) px-5 py-10 text-(--jm-bg) sm:px-8 lg:border-t-0 lg:border-l">
            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21s-6-5.4-6-11a6 6 0 1 1 12 0c0 5.6-6 11-6 11Z"
              />
              <circle cx="12" cy="10" r="2.2" />
            </svg>
            {countdown && <Countdown {...countdown} />}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
