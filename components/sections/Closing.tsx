import Link from "next/link";
import Reveal from "@/components/animation/Reveal";

interface ClosingProps {
  partner1: string;
  partner2: string;
  dateDisplay: string;
  signoff: string;
}

export default function Closing({ partner1, partner2, dateDisplay, signoff }: ClosingProps) {
  return (
    <footer className="bg-paper text-ink">
      <Reveal className="mx-auto flex max-w-7xl flex-col items-center px-5 py-24 text-center sm:px-8 sm:py-32">
        <p className="font-serif text-[clamp(1.8rem,5vw,3.6rem)] leading-tight font-light italic text-balance">
          {signoff}
        </p>

        <p className="mt-10 font-serif text-2xl tracking-wide sm:text-3xl">
          {partner1}
          <span className="mx-3 text-wine">&amp;</span>
          {partner2}
        </p>
        <p className="mt-2 text-[0.68rem] tracking-[0.35em] text-ink-soft uppercase sm:text-xs">{dateDisplay}</p>

        <Link
          href="/scroll"
          className="group mt-14 inline-flex items-center gap-3 text-xs tracking-[0.3em] text-ink-soft uppercase transition-colors hover:text-ink"
        >
          Open the parchment invitation
          <span className="block h-px w-8 bg-current transition-all group-hover:w-14" aria-hidden="true" />
        </Link>
      </Reveal>
    </footer>
  );
}
