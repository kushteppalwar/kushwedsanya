"use client";

import Reveal from "./Reveal";

export default function Divider() {
  return (
    <Reveal direction="none" duration={1.6}>
      <div className="flex items-center justify-center gap-4 py-4">
        <span className="block h-px w-16 bg-gold/40" />
        <span className="text-gold text-2xl leading-none">✦</span>
        <span className="block h-px w-16 bg-gold/40" />
      </div>
    </Reveal>
  );
}
