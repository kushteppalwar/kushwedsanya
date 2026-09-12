"use client";

import Reveal from "@/components/animation/Reveal";

interface LocationTeaserProps {
  venue?: string;
  city: string;
  state: string;
  country: string;
}

export default function LocationTeaser({ venue, city, state, country }: LocationTeaserProps) {
  return (
    <section className="relative flex min-h-[66svh] items-center overflow-hidden px-6 py-14 sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,180,216,0.24),transparent_42%),radial-gradient(circle_at_80%_80%,rgba(255,77,141,0.2),transparent_44%)]" />
      <Reveal>
        <div className="relative z-10 mx-auto w-full max-w-5xl text-center">
          <p className="font-sans text-xs tracking-[0.5em] text-cyan-100 uppercase sm:text-sm">
            Celebration location
          </p>
          <h2 className="mt-3 font-serif text-4xl text-charcoal sm:text-6xl">
            {venue || city}
          </h2>

          <p className="mt-4 font-sans text-xl text-warm-gray sm:text-3xl">
            {city}, {state}, {country}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full bg-cyan-400/20 px-4 py-1.5 font-sans text-sm tracking-[0.2em] text-cyan-50 uppercase">
              {city}
            </span>
            <span className="rounded-full bg-fuchsia-400/20 px-4 py-1.5 font-sans text-sm tracking-[0.2em] text-fuchsia-50 uppercase">
              {state}
            </span>
            <span className="rounded-full bg-amber-300/20 px-4 py-1.5 font-sans text-sm tracking-[0.2em] text-amber-50 uppercase">
              {country}
            </span>
          </div>

          <p className="mx-auto mt-7 max-w-3xl font-sans text-lg leading-relaxed text-warm-gray-light sm:text-2xl">
            Full venue details, stay suggestions, and transport tips will be
            shared in the formal invite.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
