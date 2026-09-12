"use client";

import Reveal from "@/components/animation/Reveal";

interface ClosingNoteProps {
  message: string;
  signoff: string;
  partner1: string;
  partner2: string;
}

export default function ClosingNote({ message, signoff, partner1, partner2 }: ClosingNoteProps) {
  return (
    <section className="relative flex min-h-[70svh] items-center overflow-hidden px-6 py-16 text-center sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,183,3,0.18),transparent_40%),radial-gradient(circle_at_50%_85%,rgba(181,23,158,0.22),transparent_48%)]" />

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <Reveal>
          <p className="mx-auto max-w-3xl font-sans text-lg leading-relaxed text-warm-gray sm:text-2xl">
            {message}
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-8 font-serif text-3xl font-light text-charcoal italic sm:text-5xl">
            {signoff}
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <p className="mt-6 font-sans text-lg tracking-[0.3em] text-gold uppercase sm:text-2xl">
            {partner1} &amp; {partner2}
          </p>
        </Reveal>

        <Reveal delay={0.4} direction="none">
          <div className="mt-10 flex items-center justify-center gap-4">
            <span className="block h-px w-20 bg-gradient-to-r from-transparent via-gold to-transparent" />
            <span className="text-xl text-gold">✦</span>
            <span className="block h-px w-20 bg-gradient-to-r from-transparent via-gold to-transparent" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
