import Reveal from "@/components/animation/Reveal";
import { CeremonyIcon, LeafDivider } from "@/components/v2/Ornaments";
import type { ScheduleDay } from "@/lib/content";

interface CelebrationsProps {
  days: ScheduleDay[];
  venue?: string;
}

export default function Celebrations({ days, venue }: CelebrationsProps) {
  return (
    <section id="celebrations" className="relative scroll-mt-10 px-4 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-[0.7rem] tracking-[0.38em] text-cocoa-soft uppercase sm:text-xs">Join us for</p>
        <h2 className="mt-3 font-script text-[clamp(2.8rem,8vw,4.8rem)] leading-none text-rani">
          The Celebrations
        </h2>
        <LeafDivider className="mx-auto mt-6 h-6 w-56 text-turmeric" />
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2 sm:gap-8">
        {days.flatMap((day) =>
          day.events.map((event, index) => (
            <Reveal key={`${day.day}-${event.name}`} delay={index * 0.1}>
              <article className="card-frame group h-full bg-cream-v2/95 px-7 py-10 text-center transition-transform duration-500 hover:-translate-y-1 sm:px-10">
                <p className="text-[0.68rem] tracking-[0.35em] text-turmeric uppercase">
                  {day.day}
                  {day.date && <span className="text-cocoa-soft"> · {day.date}</span>}
                </p>

                <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full border border-turmeric/50 text-rani transition-colors duration-500 group-hover:bg-rani group-hover:text-cream-v2">
                  <CeremonyIcon name={event.name} className="h-8 w-8" />
                </div>

                <h3 className="mt-6 font-serif text-3xl text-cocoa sm:text-4xl">{event.name}</h3>
                <p className="mt-3 font-sans text-xl tracking-[0.08em] text-rani">{event.time}</p>
                {venue && <p className="mt-2 font-sans text-base text-cocoa-soft">{venue}</p>}
              </article>
            </Reveal>
          ))
        )}
      </div>
    </section>
  );
}
