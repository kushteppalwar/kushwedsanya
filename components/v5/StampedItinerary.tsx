import Reveal from "@/components/animation/Reveal";
import { CeremonyIcon } from "@/components/v2/Ornaments";
import type { ScheduleDay } from "@/lib/content";

interface StampedItineraryProps {
  days: ScheduleDay[];
  year: string;
  destination: string;
}

const tilts = ["-rotate-6", "rotate-3", "-rotate-2", "rotate-6"];

export default function StampedItinerary({ days, year, destination }: StampedItineraryProps) {
  const stamps = days.flatMap((day) => day.events.map((event) => ({ day, event })));

  return (
    <section id="stamps" className="scroll-mt-10 bg-(--jm-bg-deep)/60 px-4 py-16 sm:px-8 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-[0.7rem] tracking-[0.38em] text-(--jm-muted) uppercase sm:text-xs">Passport</p>
        <h2 className="mt-3 font-serif text-[clamp(2.2rem,6vw,4rem)] leading-none text-(--jm-ink)">
          Four stamps, two days
        </h2>
        <p className="mt-4 font-sans text-lg text-(--jm-muted) italic">
          Every ceremony leaves its mark. Collect them all in {destination}.
        </p>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stamps.map(({ day, event }, index) => (
          <Reveal key={event.name} delay={index * 0.1} className="flex justify-center">
            <div
              className={`relative flex h-56 w-56 flex-col items-center justify-center rounded-full border-[3px] border-(--jm-accent) text-center text-(--jm-accent) mix-blend-multiply ${tilts[index % tilts.length]}`}
            >
              <span className="pointer-events-none absolute inset-2 rounded-full border border-dashed border-current opacity-80" aria-hidden="true" />
              <p className="text-[0.6rem] tracking-[0.3em] uppercase">
                {day.day}
                {day.date && ` · ${day.date}`}
              </p>
              <CeremonyIcon name={event.name} className="mt-2 h-10 w-10" />
              <p className="mt-2 font-serif text-2xl leading-none uppercase">{event.name}</p>
              <p className="mt-1.5 font-sans text-base tracking-[0.15em]">{event.time}</p>
              <p className="mt-1 text-[0.6rem] tracking-[0.3em] uppercase opacity-80">
                {destination} · {year}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
