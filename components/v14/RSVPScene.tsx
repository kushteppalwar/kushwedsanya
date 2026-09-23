import Reveal from "@/components/animation/Reveal";
import { LeafDivider, Mandala } from "@/components/v2/Ornaments";
import SceneShell from "@/components/v14/SceneShell";

interface RSVPSceneProps {
  message: string;
}

/** The closing ask, on its own — the arch this time framing a mandala rather than a couple. */
export default function RSVPScene({ message }: RSVPSceneProps) {
  return (
    <SceneShell tone="blush">
      <Reveal direction="none" duration={1.4}>
        <Mandala className="animate-spin-slow mx-auto h-16 w-16 text-turmeric/70 sm:h-20 sm:w-20" />
        <p className="mt-6 text-[0.75rem] tracking-[0.4em] text-rani uppercase sm:text-sm">RSVP</p>
        <p className="mx-auto mt-5 max-w-md font-serif text-2xl leading-relaxed text-cocoa sm:text-3xl">
          {message}
        </p>
        <LeafDivider className="mx-auto mt-8 h-6 w-56 text-turmeric" />
      </Reveal>
    </SceneShell>
  );
}
