"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  /** Absolute ISO instant the countdown runs to. */
  target: string;
  /** What the countdown is until, e.g. "the wedding". */
  until: string;
  /** Venue-local time, shown under the tiles. */
  when: string;
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function remainingUntil(at: number): Remaining {
  const total = Math.max(0, Math.floor((at - Date.now()) / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const units = ["days", "hours", "minutes", "seconds"] as const;

export default function Countdown({ target, until, when }: CountdownProps) {
  // Starts empty so the server and the first client paint agree; ticks every second after.
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    const at = new Date(target).getTime();
    const tick = () => setLeft(remainingUntil(at));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const arrived = left !== null && units.every((unit) => left[unit] === 0);

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-xs font-medium tracking-[0.35em] uppercase opacity-90 sm:text-[0.8rem]">
        {arrived ? "The moment is here" : `Until ${until}`}
      </p>
      <div
        className="grid w-full max-w-sm grid-cols-4 gap-2 sm:gap-3"
        role="timer"
        aria-live="off"
        aria-label={
          left
            ? `${left.days} days, ${left.hours} hours, ${left.minutes} minutes and ${left.seconds} seconds until ${until}`
            : `Counting down to ${until}`
        }
      >
        {units.map((unit) => (
          <div key={unit} className="flex flex-col items-center">
            <span className="font-serif text-[2.4rem] leading-none tabular-nums sm:text-5xl lg:text-[3.4rem]">
              {left === null
                ? "–"
                : unit === "days"
                  ? left.days
                  : String(left[unit]).padStart(2, "0")}
            </span>
            <span className="mt-2 text-[0.66rem] font-medium tracking-[0.16em] uppercase opacity-85 sm:text-xs sm:tracking-[0.25em]">
              {unit}
            </span>
          </div>
        ))}
      </div>
      <p className="text-sm font-medium tracking-[0.12em] opacity-85 sm:text-base">
        {when}
      </p>
    </div>
  );
}
