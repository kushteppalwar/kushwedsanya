import type { ComponentType } from "react";
import Reveal from "@/components/animation/Reveal";
import { IndiaGate, LotusTemple, QutubMinar } from "@/components/landmarks/DelhiLandmarks";
import { AgaKhanPalace, ShaniwarWada, SinhagadFort } from "@/components/landmarks/PuneLandmarks";
import type { JourneyStop } from "@/lib/content";
import { distanceKm } from "@/lib/geo";

interface TwoStatesProps {
  from: JourneyStop;
  to: JourneyStop;
  message: string;
}

type Landmark = ComponentType<{ className?: string }>;

const skylines: Record<string, Landmark[]> = {
  Delhi: [QutubMinar, IndiaGate, LotusTemple],
  Pune: [SinhagadFort, ShaniwarWada, AgaKhanPalace],
};

function StateCard({ stop, label }: { stop: JourneyStop; label: string }) {
  const landmarks = skylines[stop.city] ?? [];
  return (
    <article className="relative flex flex-col overflow-hidden rounded-[1.5rem] border border-(--jm-line) bg-(--jm-card) p-7 sm:p-9">
      <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-accent) uppercase">{label}</p>
      <h3 className="mt-3 font-serif text-4xl text-(--jm-ink) sm:text-5xl">{stop.state}</h3>
      <p className="mt-1 font-sans text-lg text-(--jm-muted)">
        {stop.city} · {stop.lat.toFixed(2)}°N, {stop.lon.toFixed(2)}°E
      </p>
      <p className="mt-6 font-script text-3xl text-(--jm-accent)">{stop.person}</p>

      <div className="mt-8 flex items-end justify-center gap-6 text-(--jm-ink)/70" aria-hidden="true">
        {landmarks.map((Landmark, index) => (
          <Landmark key={index} className={index === 1 ? "h-32 w-auto sm:h-40" : "h-20 w-auto sm:h-28"} />
        ))}
      </div>
    </article>
  );
}

export default function TwoStates({ from, to, message }: TwoStatesProps) {
  const km = Math.round(distanceKm(from, to) / 10) * 10;

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-[0.7rem] tracking-[0.38em] text-(--jm-muted) uppercase sm:text-xs">Two states, one story</p>
        <p className="mt-4 font-serif text-[clamp(1.6rem,4vw,2.6rem)] leading-snug text-(--jm-ink) text-balance">
          {message}
        </p>
      </Reveal>

      <div className="mt-12 grid items-stretch gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-8">
        <Reveal>
          <StateCard stop={from} label="Travelling from" />
        </Reveal>

        <Reveal direction="none" className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center md:w-40">
            <span className="hidden h-16 w-px bg-(--jm-line) md:block" />
            <span className="font-serif text-4xl text-(--jm-ink) tabular-nums sm:text-5xl">
              {km.toLocaleString("en-IN")}
            </span>
            <span className="text-[0.65rem] tracking-[0.35em] text-(--jm-muted) uppercase">km apart</span>
            <span className="font-script text-2xl text-(--jm-accent)">one heart</span>
            <span className="hidden h-16 w-px bg-(--jm-line) md:block" />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <StateCard stop={to} label="Celebrating in" />
        </Reveal>
      </div>
    </section>
  );
}
