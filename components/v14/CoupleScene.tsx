import Reveal from "@/components/animation/Reveal";
import { LeafDivider } from "@/components/v2/Ornaments";
import { buttonBase } from "@/components/v2/InvitationCard";
import SceneShell from "@/components/v14/SceneShell";
import type { EventConfig } from "@/lib/content";

interface CoupleSceneProps {
  config: EventConfig;
  directionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
}

/** One side of the couple: a name, and its parentage line if the family gave us the wording. */
function NameBlock({ name, parents }: { name: string; parents?: string }) {
  return (
    <div>
      <p className="font-script text-4xl text-rani sm:text-5xl">{name}</p>
      {parents && <p className="mt-1 font-sans text-lg text-cocoa-soft sm:text-xl">{parents}</p>}
    </div>
  );
}

/** Names, parentage and the destination — the scene the reader lands on after the welcome. */
export default function CoupleScene({ config, directionsUrl, calendarHref, calendarFileName }: CoupleSceneProps) {
  const { couple, weddingDate, location } = config;
  const place = [location.city, location.state, location.country].filter(Boolean).join(", ");

  return (
    <SceneShell tone="blush">
      <Reveal direction="none" duration={1.4}>
        <NameBlock name={couple.partner1} parents={couple.partner1Parents} />
      </Reveal>

      <Reveal direction="none" duration={1.2} delay={0.15}>
        <p className="my-5 font-script text-3xl text-turmeric sm:text-4xl">&amp;</p>
      </Reveal>

      <Reveal direction="none" duration={1.4} delay={0.3}>
        <NameBlock name={couple.partner2} parents={couple.partner2Parents} />
      </Reveal>

      <Reveal delay={0.5}>
        <LeafDivider className="mx-auto my-8 h-6 w-56 text-turmeric" />
        <p className="text-[0.75rem] tracking-[0.3em] text-cocoa uppercase sm:text-sm">{weddingDate.display}</p>
        <p className="mt-2 font-serif text-2xl text-cocoa sm:text-3xl">{location.venue ?? location.city}</p>
        <p className="mt-1 font-sans text-lg text-cocoa-soft">{place}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonBase} bg-rani text-cream-v2 shadow-[0_10px_30px_-12px_rgba(143,29,63,0.7)] hover:bg-rani-deep`}
            >
              Location
              <span aria-hidden="true">↗</span>
            </a>
          )}
          {calendarHref && (
            <a href={calendarHref} download={calendarFileName} className={`${buttonBase} border border-rani/50 text-rani hover:border-rani hover:bg-rani/5`}>
              Add to calendar
            </a>
          )}
        </div>
      </Reveal>
    </SceneShell>
  );
}
