import Reveal from "@/components/animation/Reveal";
import { CeremonyIcon, LeafDivider } from "@/components/v2/Ornaments";
import SceneShell from "@/components/v14/SceneShell";
import type { ScheduleEvent } from "@/lib/content";

interface EventSceneProps {
  event: ScheduleEvent;
  date?: string;
  index: number;
}

type Tone = "ivory" | "blush" | "gold" | "rani";

/** Keyed the same way Ornaments' CeremonyIcon picks its glyph, so the two always agree. */
const EVENT_TONES: Record<string, Tone> = {
  mehendi: "gold",
  sakharpuda: "gold",
  sangeet: "rani",
  haldi: "gold",
  wedding: "ivory",
  reception: "blush",
};
const fallbackTones: Tone[] = ["gold", "rani", "blush", "ivory"];

function toneFor(name: string, icon: string | undefined, index: number): Tone {
  const key = (icon ?? name).toLowerCase();
  const match = Object.keys(EVENT_TONES).find((k) => key.includes(k));
  return match ? EVENT_TONES[match] : fallbackTones[index % fallbackTones.length];
}

/** One ceremony, one scene: its own tone, an icon medallion, and its attire note if there is one. */
export default function EventScene({ event, date, index }: EventSceneProps) {
  const tone = toneFor(event.name, event.icon, index);
  const dark = tone === "rani";
  const attire = event.attire
    ? [event.attire.all, event.attire.women, event.attire.men].filter(Boolean).join(" · ")
    : undefined;

  return (
    <SceneShell tone={tone}>
      <Reveal direction="none" duration={1.3}>
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border sm:h-24 sm:w-24 ${
            dark ? "border-cream-v2/40 text-turmeric" : "border-turmeric/50 text-rani"
          }`}
        >
          <CeremonyIcon name={event.name} icon={event.icon} className="h-10 w-10 sm:h-12 sm:w-12" />
        </div>

        <h2 className={`mt-6 font-script text-[clamp(3rem,9vw,4.6rem)] leading-none ${dark ? "text-cream-v2" : "text-rani"}`}>
          {event.name}
        </h2>

        <LeafDivider className={`mx-auto mt-6 h-6 w-48 ${dark ? "text-turmeric/80" : "text-turmeric"}`} />

        {date && (
          <p className={`mt-6 text-[0.75rem] tracking-[0.3em] uppercase sm:text-sm ${dark ? "text-cream-v2/80" : "text-cocoa"}`}>
            {date}
          </p>
        )}
        <p className={`mt-2 font-sans text-xl tracking-[0.06em] sm:text-2xl ${dark ? "text-turmeric" : "text-rani"}`}>
          {event.time}
        </p>
        {event.hall && (
          <p className={`mt-1 font-sans text-lg ${dark ? "text-cream-v2/70" : "text-cocoa-soft"}`}>{event.hall}</p>
        )}
        {attire && (
          <p className={`mt-4 font-sans text-base italic ${dark ? "text-cream-v2/60" : "text-cocoa-soft"}`}>{attire}</p>
        )}
      </Reveal>
    </SceneShell>
  );
}
