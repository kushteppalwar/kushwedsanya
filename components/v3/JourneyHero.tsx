import Reveal from "@/components/animation/Reveal";
import JourneyMap from "@/components/v3/JourneyMap";
import type { EventConfig } from "@/lib/content";

interface JourneyHeroProps {
  config: EventConfig;
  calendarHref?: string;
  calendarFileName?: string;
}

export const jmButtonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-xs tracking-[0.28em] uppercase transition-colors duration-300 sm:text-[0.8rem]";
export const jmButtonPrimary = `${jmButtonBase} bg-(--jm-accent) text-(--jm-bg) hover:bg-(--jm-ink)`;
export const jmButtonOutline = `${jmButtonBase} border border-(--jm-ink)/35 text-(--jm-ink) hover:border-(--jm-ink) hover:bg-(--jm-ink)/5`;

export default function JourneyHero({ config, calendarHref, calendarFileName }: JourneyHeroProps) {
  const { couple, weddingDate, location, invitation, journey } = config;

  return (
    <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pt-20 pb-16 sm:px-8 lg:min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14 lg:py-24">
      <Reveal className="text-center lg:text-left">
        {journey && (
          <p className="text-[0.7rem] tracking-[0.38em] text-(--jm-muted) uppercase sm:text-xs">
            From {journey.from.state} to {journey.to.state}
          </p>
        )}
        <h1 className="mt-5 font-serif text-[clamp(2.8rem,8vw,5.6rem)] leading-[0.95] text-(--jm-ink)">
          {couple.partner1}
          <span className="block font-script text-[0.7em] leading-none text-(--jm-accent)">&amp;</span>
          {couple.partner2}
        </h1>

        {invitation && (
          <p className="mx-auto mt-7 max-w-md font-sans text-lg leading-relaxed text-(--jm-muted) italic sm:text-xl lg:mx-0">
            {invitation.intro} {invitation.request}
          </p>
        )}

        <dl className="mt-9 grid gap-5 border-y border-(--jm-line) py-6 text-left sm:grid-cols-2">
          <div>
            <dt className="text-[0.65rem] tracking-[0.35em] text-(--jm-muted) uppercase">When</dt>
            <dd className="mt-1.5 font-serif text-xl text-(--jm-ink) sm:text-2xl">{weddingDate.display}</dd>
            <dd className="text-sm text-(--jm-muted)">{weddingDate.dayOfWeek}</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] tracking-[0.35em] text-(--jm-muted) uppercase">Where</dt>
            <dd className="mt-1.5 font-serif text-xl text-(--jm-ink) sm:text-2xl">{location.venue ?? location.city}</dd>
            <dd className="text-sm text-(--jm-muted)">
              {[location.city, location.country].filter(Boolean).join(", ")}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
          <a href="#itinerary" className={jmButtonPrimary}>
            The itinerary
          </a>
          {calendarHref && (
            <a href={calendarHref} download={calendarFileName} className={jmButtonOutline}>
              Add to calendar
            </a>
          )}
        </div>
      </Reveal>

      {journey && (
        <Reveal direction="none" duration={1.8} className="mx-auto w-full max-w-[min(92vw,78vh)] lg:max-w-none">
          <div className="map-paper relative aspect-square overflow-hidden rounded-[2rem] border border-(--jm-line) bg-(--jm-bg) shadow-[0_40px_80px_-40px_rgba(31,42,68,0.45)]">
            <JourneyMap from={journey.from} to={journey.to} className="h-full w-full" />
          </div>
        </Reveal>
      )}
    </section>
  );
}
