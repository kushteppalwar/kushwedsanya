import Reveal from "@/components/animation/Reveal";
import JourneyMap from "@/components/v3/JourneyMap";
import type { JourneyStop } from "@/lib/content";
import { distanceKm } from "@/lib/geo";

interface PostcardMapProps {
  from: JourneyStop;
  to: JourneyStop;
  message: string;
  signoff: string;
  partner1: string;
  partner2: string;
}

export default function PostcardMap({ from, to, message, signoff, partner1, partner2 }: PostcardMapProps) {
  const km = Math.round(distanceKm(from, to) / 10) * 10;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
      <Reveal direction="none" duration={1.6}>
        <div className="grid overflow-hidden rounded-[1.6rem] border border-(--jm-ink)/20 bg-(--jm-card) shadow-[0_30px_70px_-40px_rgba(31,42,68,0.5)] lg:grid-cols-2">
          <div className="map-paper relative aspect-square border-b border-(--jm-line) bg-(--jm-bg) lg:border-r lg:border-b-0">
            <JourneyMap from={from} to={to} className="h-full w-full" />
          </div>

          <div className="relative flex flex-col justify-between p-7 sm:p-10">
            {/* Postage stamp */}
            <div className="absolute top-6 right-6 flex h-20 w-16 flex-col items-center justify-center border border-(--jm-accent)/60 p-1 text-center text-(--jm-accent) sm:top-8 sm:right-8">
              <span className="text-[0.55rem] tracking-[0.2em] uppercase">Post</span>
              <span className="font-serif text-2xl leading-none">{km.toLocaleString("en-IN")}</span>
              <span className="text-[0.55rem] tracking-[0.2em] uppercase">km</span>
            </div>

            <div>
              <p className="text-[0.7rem] tracking-[0.38em] text-(--jm-muted) uppercase sm:text-xs">Postcard from the road</p>
              <p className="mt-6 max-w-sm font-script text-3xl leading-snug text-(--jm-ink) sm:text-4xl">{message}</p>
              <p className="mt-6 font-script text-2xl text-(--jm-accent)">{signoff}</p>
            </div>

            <div className="mt-10 border-t border-(--jm-line) pt-5">
              <p className="text-[0.6rem] tracking-[0.3em] text-(--jm-muted) uppercase">Addressed to</p>
              <p className="mt-2 font-serif text-xl text-(--jm-ink)">Our dearest friends &amp; family</p>
              <p className="mt-4 text-[0.6rem] tracking-[0.3em] text-(--jm-muted) uppercase">From</p>
              <p className="mt-1 font-serif text-lg text-(--jm-ink)">
                {partner1} &amp; {partner2} · {from.city} → {to.city}
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
