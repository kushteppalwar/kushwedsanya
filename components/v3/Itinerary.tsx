import Reveal from "@/components/animation/Reveal";
import { CeremonyIcon } from "@/components/v2/Ornaments";
import type { ScheduleDay } from "@/lib/content";

interface ItineraryProps {
  days: ScheduleDay[];
  venue?: string;
}

export default function Itinerary({ days, venue }: ItineraryProps) {
  return (
    <section id="itinerary" className="scroll-mt-10 bg-(--jm-bg-deep)/60 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal className="text-center">
          <p className="text-[0.7rem] tracking-[0.38em] text-(--jm-muted) uppercase sm:text-xs">The itinerary</p>
          <h2 className="mt-3 font-serif text-[clamp(2.2rem,6vw,4rem)] leading-none text-(--jm-ink)">
            Two days of celebration
          </h2>
        </Reveal>

        <ol className="relative mt-14 border-l border-dashed border-(--jm-ink)/30 pl-8 sm:ml-6 sm:pl-12">
          {days.map((day) => (
            <li key={day.day} className="pb-12 last:pb-0">
              <div className="relative mb-6">
                <span
                  className="absolute top-1/2 -left-8 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-(--jm-accent) font-serif text-sm text-(--jm-bg) sm:-left-12"
                  aria-hidden="true"
                >
                  {day.day.replace(/\D+/g, "")}
                </span>
                <Reveal>
                  <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">{day.day}</p>
                  {day.date && <p className="font-serif text-2xl text-(--jm-ink) sm:text-3xl">{day.date}</p>}
                </Reveal>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {day.events.map((event, index) => (
                  <Reveal key={event.name} delay={index * 0.08}>
                    <article className="flex items-center gap-5 rounded-2xl border border-(--jm-line) bg-(--jm-card) p-5">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-(--jm-accent)/50 text-(--jm-accent)">
                        <CeremonyIcon name={event.name} className="h-7 w-7" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-serif text-2xl text-(--jm-ink)">{event.name}</h3>
                        <p className="mt-0.5 font-sans text-lg text-(--jm-accent)">{event.time}</p>
                        {venue && <p className="truncate text-sm text-(--jm-muted)">{venue}</p>}
                      </div>
                    </article>
                  </Reveal>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
