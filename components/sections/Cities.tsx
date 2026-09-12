"use client";

import { useEffect, useRef, type ComponentType } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "@/components/animation/Reveal";
import { IndiaGate, QutubMinar, LotusTemple } from "@/components/landmarks/DelhiLandmarks";
import { ShaniwarWada, SinhagadFort, AgaKhanPalace } from "@/components/landmarks/PuneLandmarks";

gsap.registerPlugin(ScrollTrigger);

interface CitiesProps {
  partner1: string;
  partner2: string;
  city1: string;
  city2: string;
  message: string;
}

type Landmark = ComponentType<{ className?: string }>;

const skylines: Record<string, Landmark[]> = {
  Delhi: [QutubMinar, IndiaGate, LotusTemple],
  Pune: [SinhagadFort, ShaniwarWada, AgaKhanPalace],
};

function CityPanel({ person, city }: { person: string; city: string }) {
  const landmarks = skylines[city] ?? [];

  return (
    <div className="relative flex flex-col justify-end overflow-hidden border-ink/15 px-5 pt-16 pb-10 sm:px-10 sm:pt-24">
      <div
        data-skyline
        className="pointer-events-none absolute inset-x-6 bottom-8 flex items-end justify-end gap-6 text-ink/[0.11] sm:inset-x-10 sm:gap-10"
        aria-hidden="true"
      >
        {landmarks.map((Landmark, index) => (
          <Landmark
            key={index}
            className={
              index === 1
                ? "h-32 w-auto sm:h-64"
                : `h-20 w-auto sm:h-44 ${index === 0 ? "hidden sm:block" : ""}`
            }
          />
        ))}
      </div>

      <Reveal className="relative">
        <p className="text-[0.68rem] tracking-[0.35em] text-ink-soft uppercase sm:text-xs">{person}</p>
        <p className="mt-3 font-serif text-[clamp(3rem,9vw,7rem)] leading-none font-light tracking-[-0.02em]">
          {city}
        </p>
      </Reveal>
    </div>
  );
}

export default function Cities({ partner1, partner2, city1, city2, message }: CitiesProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-skyline]").forEach((skyline) => {
        gsap.fromTo(
          skyline,
          { yPercent: 18 },
          {
            yPercent: -6,
            ease: "none",
            scrollTrigger: { trigger: skyline, start: "top bottom", end: "bottom top", scrub: true },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-paper text-ink">
      <Reveal className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-28">
        <p className="font-serif text-[clamp(1.5rem,4vw,2.6rem)] leading-snug font-light text-balance">
          {message}
        </p>
      </Reveal>

      <div className="grid border-y border-ink/15 sm:grid-cols-2 sm:divide-x sm:divide-ink/15">
        <CityPanel person={partner1} city={city1} />
        <div className="border-t border-ink/15 sm:border-t-0">
          <CityPanel person={partner2} city={city2} />
        </div>
      </div>
    </section>
  );
}
