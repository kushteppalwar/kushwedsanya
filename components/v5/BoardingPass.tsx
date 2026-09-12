import Reveal from "@/components/animation/Reveal";
import { jmButtonOutline, jmButtonPrimary } from "@/components/v3/JourneyHero";
import type { EventConfig } from "@/lib/content";

interface BoardingPassProps {
  config: EventConfig;
  calendarHref?: string;
  calendarFileName?: string;
}

// Fixed widths so the barcode is identical on server and client.
const barWidths = [3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 2, 4, 1, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 2, 2, 1, 4, 1, 3, 1, 1, 2];
const bars = barWidths.map((width, index) => ({
  width,
  x: barWidths.slice(0, index).reduce((offset, w) => offset + w + 1, 0),
}));

function Barcode({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 40" preserveAspectRatio="none" className={className} aria-hidden="true">
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y="0" width={bar.width} height="40" fill="currentColor" />
      ))}
    </svg>
  );
}

function Field({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[0.6rem] tracking-[0.3em] text-(--jm-muted) uppercase">{label}</p>
      <p className="mt-1 font-serif text-lg leading-tight text-(--jm-ink) sm:text-xl">{value}</p>
      {sub && <p className="text-sm text-(--jm-muted)">{sub}</p>}
    </div>
  );
}

export default function BoardingPass({ config, calendarHref, calendarFileName }: BoardingPassProps) {
  const { couple, weddingDate, location, invitation, journey } = config;
  if (!journey) return null;
  const { from, to } = journey;

  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-20 pb-16 sm:px-8 sm:pt-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-[0.7rem] tracking-[0.38em] text-(--jm-muted) uppercase sm:text-xs">Now boarding</p>
        <h1 className="mt-4 font-serif text-[clamp(2.6rem,7vw,4.8rem)] leading-none text-(--jm-ink)">
          {couple.partner1} <span className="font-script text-[0.8em] text-(--jm-accent)">&amp;</span> {couple.partner2}
        </h1>
        {invitation && (
          <p className="mx-auto mt-5 max-w-lg font-sans text-lg leading-relaxed text-(--jm-muted) italic sm:text-xl">
            {invitation.intro} {invitation.request}
          </p>
        )}
      </Reveal>

      <Reveal direction="none" duration={1.6} className="mt-12">
        <div className="grid overflow-hidden rounded-[1.6rem] border border-(--jm-ink)/20 bg-(--jm-card) shadow-[0_30px_70px_-40px_rgba(31,42,68,0.5)] lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
          {/* Main ticket */}
          <div className="relative p-6 sm:p-9">
            <div className="flex items-center justify-between border-b border-(--jm-line) pb-4">
              <p className="font-serif text-sm tracking-[0.3em] text-(--jm-ink) uppercase">Boarding pass</p>
              <p className="text-[0.65rem] tracking-[0.3em] text-(--jm-accent) uppercase">Two states · one celebration</p>
            </div>

            <div className="mt-8 grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
              <div>
                <p className="text-[0.6rem] tracking-[0.3em] text-(--jm-muted) uppercase">From</p>
                <p className="font-serif text-6xl leading-none text-(--jm-ink) sm:text-7xl">{from.code ?? from.city.slice(0, 3).toUpperCase()}</p>
                <p className="mt-2 font-sans text-lg text-(--jm-ink)">{from.city}, {from.state}</p>
                <p className="font-script text-2xl text-(--jm-accent)">{from.person}</p>
              </div>

              <div className="flex items-center gap-3 text-(--jm-accent)" aria-hidden="true">
                <span className="h-px w-10 border-t border-dashed border-current sm:w-16" />
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z" />
                </svg>
                <span className="h-px w-10 border-t border-dashed border-current sm:w-16" />
              </div>

              <div className="sm:text-right">
                <p className="text-[0.6rem] tracking-[0.3em] text-(--jm-muted) uppercase">To</p>
                <p className="font-serif text-6xl leading-none text-(--jm-ink) sm:text-7xl">{to.code ?? to.city.slice(0, 3).toUpperCase()}</p>
                <p className="mt-2 font-sans text-lg text-(--jm-ink)">{to.city}, {to.state}</p>
                <p className="font-script text-2xl text-(--jm-accent)">{to.person}</p>
              </div>
            </div>

            <div className="mt-9 grid gap-5 border-t border-(--jm-line) pt-6 sm:grid-cols-4">
              <Field label="Passenger" value="You, with family" />
              <Field label="Date" value={weddingDate.display} sub={weddingDate.dayOfWeek} />
              <Field label="Gate" value={location.venue ?? location.city} sub={[location.city, location.country].filter(Boolean).join(", ")} />
              <Field label="Class" value="Celebration" sub="All ceremonies" />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#stamps" className={jmButtonPrimary}>
                Your itinerary
              </a>
              {calendarHref && (
                <a href={calendarHref} download={calendarFileName} className={jmButtonOutline}>
                  Add to calendar
                </a>
              )}
            </div>

            {/* Perforation */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 hidden w-px border-r border-dashed border-(--jm-ink)/30 lg:block"
              aria-hidden="true"
            />
            <span className="pointer-events-none absolute -top-3 right-0 hidden h-6 w-6 translate-x-1/2 rounded-full bg-(--jm-bg) lg:block" aria-hidden="true" />
            <span className="pointer-events-none absolute -bottom-3 right-0 hidden h-6 w-6 translate-x-1/2 rounded-full bg-(--jm-bg) lg:block" aria-hidden="true" />
          </div>

          {/* Stub */}
          <div className="flex flex-col justify-between gap-6 border-t border-dashed border-(--jm-ink)/30 bg-(--jm-bg-deep)/50 p-6 sm:p-8 lg:border-t-0">
            <div>
              <p className="text-[0.6rem] tracking-[0.3em] text-(--jm-muted) uppercase">Stub</p>
              <p className="mt-2 font-serif text-2xl text-(--jm-ink)">
                {couple.partner1} &amp; {couple.partner2}
              </p>
              <p className="mt-1 text-sm text-(--jm-muted)">{weddingDate.display}</p>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.6rem] tracking-[0.3em] text-(--jm-muted) uppercase">Route</p>
                <p className="font-serif text-xl text-(--jm-ink)">
                  {from.code ?? from.city} → {to.code ?? to.city}
                </p>
              </div>
              <Barcode className="h-12 w-28 text-(--jm-ink)" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
