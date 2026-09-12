import Link from "next/link";
import Reveal from "@/components/animation/Reveal";
import { LeafDivider } from "@/components/v2/Ornaments";

interface FooterProps {
  partner1: string;
  partner2: string;
  message: string;
  signoff: string;
  hashtag?: string;
}

const otherVersions = [
  { href: "/scroll", label: "Parchment scroll" },
  { href: "/version1", label: "Editorial" },
];

export default function Footer({ partner1, partner2, message, signoff, hashtag }: FooterProps) {
  return (
    <footer className="px-4 pt-6 pb-16 sm:px-8 sm:pb-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="font-sans text-2xl leading-relaxed text-cocoa italic sm:text-3xl">{message}</p>
        <p className="mt-4 font-script text-4xl text-rani sm:text-5xl">{signoff}</p>

        <LeafDivider className="mx-auto my-10 h-6 w-56 text-turmeric" />

        {hashtag && (
          <p className="font-serif text-xl tracking-[0.12em] text-cocoa sm:text-2xl">{hashtag}</p>
        )}
        <p className="mt-3 text-[0.7rem] tracking-[0.38em] text-cocoa-soft uppercase sm:text-xs">
          With love, {partner1} &amp; {partner2}
        </p>

        <nav className="mt-12 flex items-center justify-center gap-6 text-[0.65rem] tracking-[0.3em] text-cocoa-soft/80 uppercase">
          {otherVersions.map((version) => (
            <Link key={version.href} href={version.href} className="transition-colors hover:text-rani">
              {version.label}
            </Link>
          ))}
        </nav>
      </Reveal>
    </footer>
  );
}
