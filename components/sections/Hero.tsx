"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  tagline: string;
  partner1: string;
  partner2: string;
  dateDisplay: string;
  city1?: string;
  city2?: string;
  venue?: string;
}

function RingText({ text }: { text: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="animate-spin-slow h-full w-full text-ink/70"
      aria-hidden="true"
    >
      <defs>
        <path id="hero-ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
      </defs>
      <text className="font-sans text-[11.5px] tracking-[0.32em] uppercase" fill="currentColor">
        <textPath href="#hero-ring">{text}</textPath>
      </text>
    </svg>
  );
}

export default function Hero({
  tagline,
  partner1,
  partner2,
  dateDisplay,
  city1,
  city2,
  venue,
}: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set("[data-hero-fade], .line-mask > span", { opacity: 1, y: 0 });
        return;
      }

      gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .from("[data-hero-fade]", { opacity: 0, y: -12, duration: 0.9, stagger: 0.08 }, 0.1)
        .from(".line-mask > span", { yPercent: 110, duration: 1.3, stagger: 0.14 }, 0.2)
        .from(ringRef.current, { opacity: 0, scale: 0.85, duration: 1.2 }, 0.6);

      gsap.to(ringRef.current, {
        yPercent: 25,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const ringCopy = [`${partner1} & ${partner2}`, dateDisplay, venue ?? city1]
    .filter(Boolean)
    .join("  ·  ")
    .concat("  ·  ");

  return (
    <section
      id="top"
      ref={sectionRef}
      className="grain relative flex min-h-[100svh] flex-col overflow-hidden bg-paper text-ink"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 pt-24 pb-10 sm:px-8 sm:pt-28">
        <div className="flex flex-col gap-1.5 text-[0.68rem] tracking-[0.35em] text-ink-soft uppercase sm:flex-row sm:items-center sm:justify-between sm:text-xs">
          <p data-hero-fade>{tagline}</p>
          <p data-hero-fade>{dateDisplay}</p>
        </div>

        <h1 className="my-auto py-6 font-serif font-light leading-[0.88] tracking-[-0.02em] text-[clamp(4.5rem,19vw,8rem)] sm:py-8 sm:text-[clamp(6rem,13.5vw,12rem)]">
          <span className="line-mask">
            <span>{partner1}</span>
          </span>

          <span className="my-2 flex items-center gap-6 sm:my-4 sm:gap-10">
            <span
              ref={ringRef}
              className="relative block h-[clamp(6.5rem,15vw,10.5rem)] w-[clamp(6.5rem,15vw,10.5rem)] shrink-0"
            >
              <RingText text={ringCopy} />
              <span className="absolute inset-0 flex items-center justify-center font-serif text-[clamp(2.6rem,6vw,4.8rem)] font-normal italic text-wine">
                &amp;
              </span>
            </span>

            {(city1 || city2) && (
              <span
                data-hero-fade
                className="font-sans text-base leading-snug font-normal tracking-[0.02em] text-ink-soft sm:text-xl"
              >
                {city1}
                <span className="mx-2 text-brass">→</span>
                {city2}
                <span className="mt-1 block text-sm tracking-[0.25em] uppercase sm:text-base">
                  Two cities, one celebration
                </span>
              </span>
            )}
          </span>

          <span className="line-mask text-right">
            <span>{partner2}</span>
          </span>
        </h1>

        <div
          data-hero-fade
          className="flex items-end justify-between border-t border-ink/15 pt-5 text-[0.68rem] tracking-[0.35em] text-ink-soft uppercase sm:text-xs"
        >
          <a href="#schedule" className="group inline-flex items-center gap-3 transition-colors hover:text-ink">
            <span className="block h-px w-10 bg-current transition-all group-hover:w-16" />
            Scroll
          </a>
          {venue && <p>{venue}</p>}
        </div>
      </div>
    </section>
  );
}
