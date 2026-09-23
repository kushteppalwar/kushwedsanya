"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { GardenArch } from "@/components/v14/GardenArch";
import { Mandala } from "@/components/v2/Ornaments";

interface GardenGateProps {
  partner1: string;
  partner2: string;
}

/**
 * The gate the site opens with: two arched doors that part on a tap, the way
 * a garden pavilion's doors would. Holds the page still and scrolled to the
 * top until the reader opens it, then hands over — the same lock/release
 * pattern the version 12 loader uses, but driven by a tap rather than a timer.
 */
export default function GardenGate({ partner1, partner2 }: GardenGateProps) {
  const [opened, setOpened] = useState(false);
  const [done, setDone] = useState(false);
  const doorRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (done) return;
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    window.scrollTo(0, 0);
    return () => {
      html.style.overflow = previousOverflow;
    };
  }, [done]);

  const open = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDone(true);
      return;
    }
    setOpened(true);
  };

  if (done) return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-cocoa"
      role="dialog"
      aria-modal="true"
      aria-label={`Invitation gate for the wedding of ${partner1} and ${partner2}`}
    >
      {/* Left door */}
      <div
        className={`absolute inset-y-0 left-0 flex w-1/2 items-center justify-end overflow-hidden bg-[linear-gradient(115deg,var(--color-cocoa),var(--color-rani-deep)_60%,var(--color-rani)_135%)] transition-transform duration-[1100ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
          opened ? "-translate-x-full" : "translate-x-0"
        }`}
        onTransitionEnd={() => opened && setDone(true)}
      >
        <GardenArch className="h-[90%] w-auto text-turmeric/70" />
      </div>
      {/* Right door */}
      <div
        className={`absolute inset-y-0 right-0 flex w-1/2 items-center justify-start overflow-hidden bg-[linear-gradient(245deg,var(--color-cocoa),var(--color-rani-deep)_60%,var(--color-rani)_135%)] transition-transform duration-[1100ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
          opened ? "translate-x-full" : "translate-x-0"
        }`}
      >
        <GardenArch className="h-[90%] w-auto -scale-x-100 text-turmeric/70" />
      </div>

      {/* Centre seam: monogram and the tap prompt */}
      <div
        ref={doorRef}
        className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center transition-opacity duration-500 ${
          opened ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="text-[0.68rem] tracking-[0.4em] text-cream-v2/80 uppercase drop-shadow-sm">You&rsquo;re invited</p>
        <div className="relative flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
          <Mandala className="animate-shimmer absolute inset-0 text-turmeric" />
          <span className="relative font-script text-4xl text-cream-v2 sm:text-5xl">
            {partner1.charAt(0)}
            <span className="mx-1 text-2xl text-turmeric sm:text-3xl">&amp;</span>
            {partner2.charAt(0)}
          </span>
        </div>
        <p className="font-script text-3xl text-cream-v2 sm:text-4xl">
          {partner1} <span className="text-turmeric">&amp;</span> {partner2}
        </p>
        <button
          type="button"
          onClick={open}
          className="pointer-events-auto mt-4 inline-flex items-center gap-3 rounded-full border border-cream-v2/60 bg-cream-v2/10 px-7 py-3 text-xs tracking-[0.35em] text-cream-v2 uppercase backdrop-blur-sm transition-colors duration-300 hover:bg-cream-v2/20"
        >
          Tap to enter
        </button>
      </div>
    </div>
  );
}
