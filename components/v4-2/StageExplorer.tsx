"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { VehicleKind } from "@/components/v4/vehicles";
import type { Atlas3DPin, Atlas3DPlace, AtlasFocus, MapPoint } from "@/components/v4-1/atlas";
import type { ExplorerRoute, ExplorerStage } from "@/components/v4-2/stages";
import { buttonPrimary } from "@/components/v13/styles";

const ExplorerScene = dynamic(() => import("@/components/v4-2/ExplorerScene"), {
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

/**
 * The version 13 journey as a run of explorable worlds. One stop fills the
 * screen at a time — drag to look around, watch the traveller go round — and
 * the Next button, always in the same place, flies the camera to the next one.
 */
interface StageExplorerProps {
  stages: ExplorerStage[];
  routes: ExplorerRoute[];
  pins: Atlas3DPin[];
  places: Atlas3DPlace[];
  rail: { from: string; to: string };
  /** Where the look-at point sits on the stage, as fractions of width and height. */
  focus: AtlasFocus;
  centre: MapPoint;
  gridOrigin: MapPoint;
  /** Card content per stop, keyed by stage key. */
  cards: Record<string, ReactNode>;
  /** The opening panel, shown over the map on the intro stage. */
  intro: ReactNode;
  ariaLabel: string;
}

const stepButton =
  "flex h-12 w-12 items-center justify-center rounded-full border border-(--jm-line) bg-(--jm-bg)/80 text-(--jm-ink) shadow-[0_12px_30px_-18px_rgba(0,0,0,0.6)] backdrop-blur transition-[opacity,background-color,transform] duration-300 hover:bg-(--jm-bg) active:scale-95 disabled:pointer-events-none disabled:opacity-30";

export default function StageExplorer({
  stages,
  routes,
  pins,
  places,
  rail,
  focus,
  centre,
  gridOrigin,
  cards,
  intro,
  ariaLabel,
}: StageExplorerProps) {
  const [index, setIndex] = useState(0);
  const [kind, setKind] = useState<VehicleKind>("plane");
  // The canvas only renders while the stage is on screen
  const [active, setActive] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  const stage = stages[index];
  const last = index === stages.length - 1;
  const upcoming = stages[index + 1];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      rootMargin: "20% 0px",
    });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const next = () => {
    if (!last) {
      setIndex(index + 1);
      return;
    }
    // Past the last stop, carry on to what follows the map
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document
      .getElementById("itinerary")
      ?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
  };
  const previous = () => setIndex(Math.max(0, index - 1));

  // The cards sit on the left, so the map's point of interest sits to the right
  const sceneFocus: AtlasFocus = {
    portrait: focus.portrait,
    landscape: { x: 1 - focus.landscape.x, y: focus.landscape.y },
  };

  const nextLabel = stage.intro ? "Begin the journey" : last ? "The itinerary" : `Next · ${upcoming.short}`;

  const stepper = (
    <div className="pointer-events-auto flex items-center gap-3">
      <button
        type="button"
        onClick={previous}
        disabled={index === 0}
        aria-label="Previous stop"
        className={stepButton}
      >
        <svg
          viewBox="0 0 16 10"
          className="h-2.5 w-4 rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 2 L8 8 L14 2" />
        </svg>
      </button>
      <button
        type="button"
        onClick={next}
        className={`${buttonPrimary} shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)]`}
        aria-label={stage.intro ? "Begin the journey" : last ? "Continue to the itinerary" : `Next stop: ${upcoming.short}`}
      >
        {nextLabel}
        <svg
          viewBox="0 0 16 10"
          className={`h-2.5 w-4 ${last ? "" : "-rotate-90"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 2 L8 8 L14 2" />
        </svg>
      </button>
    </div>
  );

  const vehicleSwitch = (
    <div
      className={`pointer-events-auto flex rounded-full border border-(--jm-line) bg-(--jm-bg)/70 p-1 backdrop-blur transition-[opacity,visibility] duration-500 ${
        stage.vehicle ? "opacity-100" : "invisible opacity-0"
      }`}
      role="radiogroup"
      aria-label="How the journey is travelled"
      aria-hidden={!stage.vehicle}
    >
      {modes.map((mode) => {
        const on = mode.kind === kind;
        return (
          <button
            key={mode.kind}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={stage.vehicle ? 0 : -1}
            onClick={() => setKind(mode.kind)}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-[0.68rem] font-medium tracking-[0.25em] uppercase transition-colors sm:px-4 ${
              on ? "bg-(--jm-accent) text-(--jm-bg)" : "text-(--jm-ink) hover:bg-(--jm-ink)/10"
            }`}
          >
            <span aria-hidden="true">{mode.icon}</span>
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className="relative h-svh min-h-[600px] overflow-hidden bg-(--jm-bg)"
      aria-roledescription="carousel"
      aria-label="The journey, stop by stop"
    >
      {/* Isolated so the scene's own labels never stack above the cards. Vertical swipes
          still scroll the page on phones; sideways drags turn the world. */}
      <div className="absolute inset-0 isolate [&_canvas]:touch-pan-y!" role="img" aria-label={ariaLabel}>
        <ExplorerScene
          stages={stages}
          stageIndex={index}
          kind={kind}
          routes={routes}
          pins={pins}
          places={places}
          focus={sceneFocus}
          centre={centre}
          gridOrigin={gridOrigin}
          active={active}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, color-mix(in srgb, var(--jm-bg-deep) 85%, transparent) 100%)",
        }}
      />

      {/* Progress rail */}
      <div className="pointer-events-none absolute inset-x-5 top-5 flex items-center gap-3 text-[0.7rem] font-medium tracking-[0.3em] text-(--jm-ink) uppercase sm:inset-x-8 sm:top-7 sm:text-xs">
        <span>{rail.from}</span>
        <span className="relative h-px flex-1 bg-(--jm-ink)/25">
          {stages.map((step, i) => (
            <span
              key={step.key}
              className="absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--jm-ink)/40"
              style={{ left: `${(i / (stages.length - 1)) * 100}%` }}
            />
          ))}
          <span
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--jm-accent) transition-[left] duration-1000 ease-in-out"
            style={{ left: `${(index / (stages.length - 1)) * 100}%` }}
          />
        </span>
        <span>{rail.to}</span>
      </div>

      <p className="pointer-events-none absolute top-14 right-5 hidden rounded-full border border-(--jm-line) bg-(--jm-bg)/50 px-4 py-2 text-[0.65rem] tracking-[0.3em] text-(--jm-muted) uppercase backdrop-blur sm:top-16 sm:right-8 sm:block">
        Drag to look around
      </p>

      {/* Opening panel, over the living map */}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center px-6 pt-16 pb-36 text-center transition-[opacity,transform,visibility] duration-700 sm:px-10 lg:pb-16 ${
          stage.intro ? "opacity-100" : "invisible -translate-y-8 opacity-0"
        }`}
        aria-hidden={!stage.intro}
      >
        <div className="w-full max-w-3xl drop-shadow-[0_2px_24px_rgba(0,0,0,0.75)]">{intro}</div>
      </div>

      {/* Cards: bottom of the screen on phones, a column on the left on wide screens */}
      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-col gap-3 sm:inset-x-8 sm:bottom-8 lg:inset-y-0 lg:left-8 lg:right-auto lg:w-[26rem] lg:justify-center">
        <div className="flex items-end justify-between gap-3 lg:hidden">
          {vehicleSwitch}
          {stepper}
        </div>
        <div className="relative grid items-end">
          {stages
            .filter((step) => !step.intro)
            .map((step) => {
              const on = step.key === stage.key;
              return (
                <div
                  key={step.key}
                  className={`[grid-area:1/1] transition-[opacity,transform,visibility] duration-500 ${
                    on ? "opacity-100" : "invisible translate-y-4 opacity-0"
                  }`}
                  aria-hidden={!on}
                >
                  <div className="rounded-[1.2rem] border border-(--jm-line) bg-(--jm-bg)/95 p-5 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] sm:rounded-[1.4rem] sm:bg-(--jm-bg)/80 sm:p-8 sm:backdrop-blur-md">
                    {cards[step.key]}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Wide screens: the switch bottom-left, Next and Previous bottom-right, always in reach */}
      <div className="pointer-events-none absolute inset-x-8 bottom-8 z-10 hidden items-end justify-between lg:flex">
        {vehicleSwitch}
        {stepper}
      </div>
    </section>
  );
}
