import Link from "next/link";
import Reveal from "@/components/animation/Reveal";

interface JourneyFooterProps {
  partner1: string;
  partner2: string;
  signoff: string;
  hashtag?: string;
  versions: { href: string; label: string }[];
}

export default function JourneyFooter({ partner1, partner2, signoff, hashtag, versions }: JourneyFooterProps) {
  return (
    <footer className="px-5 pt-4 pb-16 sm:px-8 sm:pb-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="font-script text-4xl text-(--jm-accent) sm:text-5xl">{signoff}</p>
        <p className="mt-6 font-serif text-2xl text-(--jm-ink)">
          {partner1} <span className="text-(--jm-accent)">&amp;</span> {partner2}
        </p>
        {hashtag && (
          <p className="mt-2 text-[0.7rem] tracking-[0.35em] text-(--jm-muted) uppercase sm:text-xs">{hashtag}</p>
        )}

        <nav className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.65rem] tracking-[0.3em] text-(--jm-muted) uppercase">
          {versions.map((version) => (
            <Link key={version.href} href={version.href} className="transition-colors hover:text-(--jm-accent)">
              {version.label}
            </Link>
          ))}
        </nav>
      </Reveal>
    </footer>
  );
}
