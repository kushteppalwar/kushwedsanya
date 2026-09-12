"use client";

import Reveal from "@/components/animation/Reveal";

interface DateHighlightProps {
  startDay: string;
  endDay?: string;
  month: string;
  year: string;
  dayOfWeek: string;
}

export default function DateHighlight({
  startDay,
  endDay,
  month,
  year,
  dayOfWeek,
}: DateHighlightProps) {
  const isRange = !!endDay;

  return (
    <section className="relative flex min-h-[70svh] items-center overflow-hidden px-6 py-16 sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(255,183,3,0.2),transparent_42%),radial-gradient(circle_at_22%_78%,rgba(181,23,158,0.2),transparent_44%)]" />
      <Reveal>
        <div className="relative z-10 mx-auto w-full max-w-6xl text-center">
          <p className="font-sans text-xs tracking-[0.5em] text-amber-100 uppercase sm:text-sm">
            Save the dates
          </p>
          <p className="mt-2 font-sans text-lg tracking-[0.25em] text-warm-gray uppercase sm:text-2xl">
            {dayOfWeek}
          </p>

          <div className="mt-7 flex items-end justify-center gap-3 sm:gap-5">
            <span className="font-serif text-2xl tracking-wider text-warm-gray-light uppercase sm:text-3xl">
              {month}
            </span>
            {isRange ? (
              <span className="font-serif text-7xl leading-none text-transparent sm:text-9xl">
                <span
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #fff4dd 0%, #ffd166 40%, #ff4d8d 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                  }}
                >
                  {startDay}-{endDay}
                </span>
              </span>
            ) : (
              <span className="font-serif text-7xl leading-none text-transparent sm:text-9xl">
                <span
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #fff4dd 0%, #ffd166 40%, #ff4d8d 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                  }}
                >
                  {startDay}
                </span>
              </span>
            )}
            <span className="mb-1 font-serif text-2xl tracking-wider text-warm-gray-light uppercase sm:text-3xl">
              {year}
            </span>
          </div>

          <p className="mx-auto mt-8 max-w-3xl font-sans text-xl leading-relaxed text-warm-gray sm:text-2xl">
            Pack your smiles. This is not just an event, it is the beginning of
            a bright new chapter.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className="h-px w-14 bg-gradient-to-r from-transparent via-gold to-transparent sm:w-20" />
            <span className="text-gold">✦</span>
            <span className="h-px w-14 bg-gradient-to-r from-transparent via-gold to-transparent sm:w-20" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
