import Link from "next/link";
import Reveal from "@/components/animation/Reveal";
import { LeafDivider } from "@/components/v2/Ornaments";

interface GardenFooterProps {
  partner1: string;
  partner2: string;
  signoff: string;
  hashtag?: string;
  versions: { href: string; label: string }[];
}

export default function GardenFooter({ partner1, partner2, signoff, hashtag, versions }: GardenFooterProps) {
  return (
    <footer className="bg-[radial-gradient(ellipse_at_top,var(--color-cream-v2),var(--color-blush)_75%)] px-4 pt-6 pb-16 sm:px-8 sm:pb-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="font-script text-4xl text-rani sm:text-5xl">{signoff}</p>
        <p className="mt-6 font-serif text-2xl text-cocoa sm:text-3xl">
          {partner1} <span className="text-rani">&amp;</span> {partner2}
        </p>
        {hashtag && (
          <p className="mt-2 text-[0.7rem] tracking-[0.38em] text-cocoa-soft uppercase sm:text-xs">{hashtag}</p>
        )}

        <LeafDivider className="mx-auto my-10 h-6 w-56 text-turmeric" />

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[0.65rem] tracking-[0.3em] text-cocoa-soft/80 uppercase">
          {versions.map((version) => (
            <Link key={version.href} href={version.href} className="transition-colors hover:text-rani">
              {version.label}
            </Link>
          ))}
        </nav>
      </Reveal>
    </footer>
  );
}
