"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/animation/Reveal";
import { LeafDivider } from "@/components/v2/Ornaments";

interface CountdownBlockProps {
  target: string;
}

const units = ["days", "hours", "minutes", "seconds"] as const;
type Remaining = Record<(typeof units)[number], number>;

function remaining(target: number): Remaining {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownBlock({ target }: CountdownBlockProps) {
  const [time, setTime] = useState<Remaining | null>(null);

  useEffect(() => {
    const at = new Date(target).getTime();
    const tick = () => setTime(remaining(at));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return (
    <section className="px-4 py-20 sm:px-8 sm:py-28">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-[0.7rem] tracking-[0.38em] text-cocoa-soft uppercase sm:text-xs">Counting down to</p>
        <h2 className="mt-3 font-script text-[clamp(2.8rem,8vw,4.8rem)] leading-none text-rani">The Big Day</h2>
        <LeafDivider className="mx-auto mt-6 h-6 w-56 text-turmeric" />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
          {units.map((unit) => (
            <div key={unit} className="card-frame bg-cream-v2/95 px-4 py-7 sm:py-9">
              <p className="font-serif text-4xl text-cocoa tabular-nums sm:text-5xl" aria-live="off">
                {time ? String(time[unit]).padStart(2, "0") : "–"}
              </p>
              <p className="mt-2 text-[0.65rem] tracking-[0.35em] text-cocoa-soft uppercase">{unit}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
