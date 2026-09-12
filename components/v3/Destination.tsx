"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/animation/Reveal";
import { jmButtonOutline, jmButtonPrimary } from "@/components/v3/JourneyHero";
import type { EventLocation } from "@/lib/content";

interface DestinationProps {
  location: EventLocation;
  dateDisplay: string;
  countdownTarget?: string;
  directionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

function useDaysUntil(target?: string) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    const at = new Date(target).getTime();
    const tick = () => setDays(Math.max(0, Math.ceil((at - Date.now()) / 86_400_000)));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [target]);
  return days;
}

export default function Destination({
  location,
  dateDisplay,
  countdownTarget,
  directionsUrl,
  calendarHref,
  calendarFileName,
}: DestinationProps) {
  const days = useDaysUntil(countdownTarget);
  const place = [location.city, location.state, location.country].filter(Boolean).join(", ");

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <Reveal>
        <div className="grid overflow-hidden rounded-[2rem] border border-(--jm-line) bg-(--jm-card) lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="p-8 sm:p-12">
            <p className="text-[0.7rem] tracking-[0.38em] text-(--jm-muted) uppercase sm:text-xs">Destination</p>
            <h2 className="mt-4 font-serif text-[clamp(2.2rem,6vw,4.2rem)] leading-[0.98] text-(--jm-ink) text-balance">
              {location.venue ?? location.city}
            </h2>
            <p className="mt-4 font-sans text-xl text-(--jm-muted)">{place}</p>
            <p className="mt-1 text-[0.72rem] tracking-[0.3em] text-(--jm-muted) uppercase">{dateDisplay}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              {directionsUrl && (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className={jmButtonPrimary}>
                  Get directions
                  <span aria-hidden="true">↗</span>
                </a>
              )}
              {calendarHref && (
                <a href={calendarHref} download={calendarFileName} className={jmButtonOutline}>
                  Add to calendar
                </a>
              )}
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center gap-3 border-t border-(--jm-line) bg-(--jm-accent) p-10 text-center text-(--jm-bg) lg:border-t-0 lg:border-l">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-5.4-6-11a6 6 0 1 1 12 0c0 5.6-6 11-6 11Z" />
              <circle cx="12" cy="10" r="2.2" />
            </svg>
            <p className="font-serif text-6xl leading-none tabular-nums sm:text-7xl" aria-live="off">
              {days ?? "–"}
            </p>
            <p className="text-[0.65rem] tracking-[0.35em] uppercase opacity-90">days to go</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
