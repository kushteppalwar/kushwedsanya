import Reveal from "@/components/animation/Reveal";
import Countdown from "@/components/v13/Countdown";

interface CountdownBandProps {
  /** Absolute ISO instant the countdown runs to. */
  target: string;
  /** What the countdown is until, e.g. "the wedding". */
  until: string;
  /** Venue-local time, shown under the tiles. */
  when: string;
}

/**
 * The page's closing beat: just the live countdown, on the accent colour. The
 * venue has already had its say on the wedding stop and in the itinerary, so
 * nothing here repeats it.
 */
export default function CountdownBand({ target, until, when }: CountdownBandProps) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <Reveal>
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-(--jm-accent) px-6 py-12 text-(--jm-bg) sm:px-12 sm:py-16">
          <Countdown target={target} until={until} when={when} />
        </div>
      </Reveal>
    </section>
  );
}
