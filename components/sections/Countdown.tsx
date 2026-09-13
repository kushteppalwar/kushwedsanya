"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  /** Absolute instant of the first ceremony, e.g. "2026-11-23T13:00:00+05:30". */
  target: string;
  className?: string;
}

function remaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
  };
}

export default function Countdown({ target, className = "" }: CountdownProps) {
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    const at = new Date(target).getTime();
    const tick = () => setTime(remaining(at));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!time) return <span className={className} aria-hidden="true" />;

  const parts = [
    [time.days, "d"],
    [time.hours, "h"],
    [time.minutes, "m"],
  ] as const;

  return (
    <span className={`inline-flex items-baseline gap-2 tabular-nums ${className}`}>
      {parts.map(([value, unit]) => (
        <span key={unit}>
          <span className="font-serif">{value}</span>
          <span className="ml-0.5 text-[0.7em] text-ink-soft">{unit}</span>
        </span>
      ))}
    </span>
  );
}
