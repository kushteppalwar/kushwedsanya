"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "@/components/animation/Reveal";
import type { ScheduleDay } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

interface ScheduleProps {
  days: ScheduleDay[];
  dateDisplay: string;
}

function dayNumber(day: ScheduleDay) {
  return day.date?.match(/\d+/)?.[0] ?? day.day.replace(/\D+/g, "");
}

export default function Schedule({ days, dateDisplay }: ScheduleProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-timeline]").forEach((list) => {
        gsap.fromTo(
          list.querySelector("[data-timeline-line]"),
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: list, start: "top 75%", end: "bottom 55%", scrub: true },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const firstNumber = days.map((_, dayIndex) =>
    days.slice(0, dayIndex).reduce((count, day) => count + day.events.length, 1)
  );

  return (
    <section id="schedule" ref={sectionRef} className="scroll-mt-16 bg-paper text-ink">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal className="mb-14 flex flex-col gap-4 sm:mb-20 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] tracking-[0.35em] text-ink-soft uppercase sm:text-xs">Schedule</p>
            <h2 className="mt-3 font-serif text-[clamp(2.4rem,6vw,4.5rem)] leading-none font-light tracking-[-0.02em]">
              Two days of celebration
            </h2>
          </div>
          <p className="font-sans text-lg text-ink-soft sm:text-xl">{dateDisplay}</p>
        </Reveal>

        {days.map((day, dayIndex) => (
          <div
            key={day.day}
            className="grid gap-8 border-t border-ink/15 py-12 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-16 sm:py-16"
          >
            <Reveal className="self-start sm:sticky sm:top-28">
              <p className="text-[0.68rem] tracking-[0.35em] text-wine uppercase sm:text-xs">{day.day}</p>
              <p className="mt-2 font-serif text-[clamp(5rem,14vw,11rem)] leading-none font-light tracking-[-0.04em]">
                {dayNumber(day)}
              </p>
              {day.date && <p className="mt-2 font-sans text-lg text-ink-soft sm:text-xl">{day.date}</p>}
            </Reveal>

            <ol data-timeline className="relative pl-8 sm:pl-12">
              <span
                className="absolute top-0 bottom-0 left-0 w-px bg-ink/15"
                aria-hidden="true"
              />
              <span
                data-timeline-line
                className="absolute top-0 bottom-0 left-0 w-px origin-top bg-wine"
                aria-hidden="true"
              />

              {day.events.map((event, eventIndex) => (
                <li key={event.name} className="py-7 first:pt-0 last:pb-0 sm:py-9">
                  <Reveal className="relative flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
                    <span
                      className="absolute top-1/2 -left-8 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-wine bg-paper sm:-left-12"
                      aria-hidden="true"
                    />
                    <span className="flex items-baseline gap-4">
                      <span className="font-sans text-sm tracking-[0.2em] text-brass tabular-nums">
                        {String(firstNumber[dayIndex] + eventIndex).padStart(2, "0")}
                      </span>
                      <span className="font-serif text-[clamp(1.8rem,4.5vw,3.2rem)] leading-none font-light">
                        {event.name}
                      </span>
                    </span>
                    <span className="font-sans text-lg tracking-[0.12em] text-ink-soft tabular-nums sm:text-xl">
                      {event.time}
                    </span>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
