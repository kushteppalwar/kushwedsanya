"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { EventConfig } from "@/lib/content";
import type { VehicleKind } from "@/components/v4/vehicles";

const FlyoverScene = dynamic(() => import("@/components/v4/FlyoverScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-[0.7rem] tracking-[0.35em] text-(--jm-muted) uppercase">
      Charting the route…
    </div>
  ),
});

const modes: { kind: VehicleKind; label: string; icon: string }[] = [
  { kind: "plane", label: "By air", icon: "✈" },
  { kind: "train", label: "By rail", icon: "🚂" },
  { kind: "car", label: "By road", icon: "🚗" },
];

interface FlyoverHeroProps {
  config: EventConfig;
}

export default function FlyoverHero({ config }: FlyoverHeroProps) {
  const [kind, setKind] = useState<VehicleKind>("plane");
  const { couple, weddingDate, location, journey } = config;

  return (
    <section className="relative h-svh min-h-[560px] overflow-hidden bg-(--jm-bg)">
      <div className="absolute inset-0">
        {journey && <FlyoverScene from={journey.from} to={journey.to} kind={kind} />}
      </div>

      {/* Overlay — readable over the scene, never blocking the drag */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-md">
            {journey && (
              <p className="text-[0.68rem] tracking-[0.38em] text-(--jm-muted) uppercase sm:text-xs">
                From {journey.from.state} to {journey.to.state}
              </p>
            )}
            <h1 className="mt-3 font-serif text-[clamp(2.4rem,7vw,4.6rem)] leading-[0.95] text-(--jm-ink) drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]">
              {couple.partner1} <span className="font-script text-[0.75em] text-(--jm-accent)">&amp;</span>{" "}
              {couple.partner2}
            </h1>
            <p className="mt-3 font-sans text-lg text-(--jm-ink)/85 sm:text-xl">
              {weddingDate.display}
              <span className="mx-2 text-(--jm-accent)">·</span>
              {location.venue ?? location.city}
            </p>
          </div>
          <p className="hidden shrink-0 rounded-full border border-(--jm-line) bg-(--jm-bg)/50 px-4 py-2 text-[0.65rem] tracking-[0.3em] text-(--jm-muted) uppercase backdrop-blur sm:block">
            Drag to look around
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div
            className="pointer-events-auto flex rounded-full border border-(--jm-line) bg-(--jm-bg)/60 p-1 backdrop-blur"
            role="radiogroup"
            aria-label="How the journey is travelled"
          >
            {modes.map((mode) => {
              const active = mode.kind === kind;
              return (
                <button
                  key={mode.kind}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setKind(mode.kind)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-[0.68rem] tracking-[0.25em] uppercase transition-colors sm:px-5 ${
                    active ? "bg-(--jm-accent) text-(--jm-bg)" : "text-(--jm-ink) hover:bg-(--jm-ink)/10"
                  }`}
                >
                  <span aria-hidden="true">{mode.icon}</span>
                  {mode.label}
                </button>
              );
            })}
          </div>

          <a
            href="#itinerary"
            className="pointer-events-auto inline-flex items-center gap-3 text-[0.68rem] tracking-[0.3em] text-(--jm-ink) uppercase transition-colors hover:text-(--jm-accent)"
          >
            The itinerary
            <span className="block h-px w-8 bg-current" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
