import type { ReactNode } from "react";
import { CornerSprig } from "@/components/v2/Ornaments";
import { GardenArch, GardenGarland } from "@/components/v14/GardenArch";

/**
 * One "step through the garden" — a full-height panel with an arch frame,
 * a trailing garland and corner sprigs behind whatever content is passed in.
 * Every scene in version 14 is one of these, in a different tone.
 */
type Tone = "ivory" | "blush" | "gold" | "rani";

const tones: Record<Tone, { bg: string; arch: string; garland: string; sprig: string }> = {
  ivory: {
    bg: "bg-[radial-gradient(ellipse_at_top,var(--color-cream-v2),var(--color-blush)_75%)]",
    arch: "text-turmeric/50",
    garland: "text-sage",
    sprig: "text-turmeric/70",
  },
  blush: {
    bg: "bg-[radial-gradient(ellipse_at_top,var(--color-blush),var(--color-cream-v2)_70%)]",
    arch: "text-rani/40",
    garland: "text-sage",
    sprig: "text-rani/50",
  },
  gold: {
    bg: "bg-[radial-gradient(ellipse_at_top,#fdf3d8,var(--color-cream-v2)_72%)]",
    arch: "text-turmeric/60",
    garland: "text-sage",
    sprig: "text-turmeric/80",
  },
  rani: {
    bg: "bg-[radial-gradient(ellipse_at_top,#3a1024,var(--color-rani-deep)_65%,var(--color-rani)_130%)]",
    arch: "text-cream-v2/25",
    garland: "text-cream-v2/40",
    sprig: "text-turmeric/60",
  },
};

interface SceneShellProps {
  tone: Tone;
  children: ReactNode;
  id?: string;
  className?: string;
}

export default function SceneShell({ tone, children, id, className = "" }: SceneShellProps) {
  const palette = tones[tone];
  const dark = tone === "rani";

  return (
    <section
      id={id}
      className={`relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 py-16 sm:px-8 ${palette.bg} ${className}`}
    >
      <GardenArch
        className={`pointer-events-none absolute top-0 left-1/2 h-[85%] w-[min(70rem,92vw)] -translate-x-1/2 ${palette.arch}`}
      />
      <GardenGarland
        className={`pointer-events-none absolute top-0 left-1/2 h-16 w-[min(48rem,88vw)] -translate-x-1/2 ${palette.garland}`}
      />
      <CornerSprig className={`pointer-events-none absolute top-3 left-3 h-14 w-14 sm:h-20 sm:w-20 ${palette.sprig}`} />
      <CornerSprig
        className={`pointer-events-none absolute top-3 right-3 h-14 w-14 -scale-x-100 sm:h-20 sm:w-20 ${palette.sprig}`}
      />
      <CornerSprig
        className={`pointer-events-none absolute bottom-3 left-3 h-14 w-14 -scale-y-100 sm:h-20 sm:w-20 ${palette.sprig}`}
      />
      <CornerSprig
        className={`pointer-events-none absolute right-3 bottom-3 h-14 w-14 -scale-100 sm:h-20 sm:w-20 ${palette.sprig}`}
      />

      <div className={`relative z-10 w-full max-w-2xl text-center ${dark ? "text-cream-v2" : "text-cocoa"}`}>
        {children}
      </div>
    </section>
  );
}
