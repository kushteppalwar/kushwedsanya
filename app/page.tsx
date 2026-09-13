import type { Metadata } from "next";
import Link from "next/link";
import { getEventConfig, getEventMeta } from "@/lib/content";
import { siteVersions } from "@/lib/versions";

const config = getEventConfig("wedding")!;

export function generateMetadata(): Metadata {
  const meta = getEventMeta(config);
  return { title: meta.title, description: meta.description };
}

export default function Home() {
  const { couple, weddingDate, location } = config;

  return (
    <div className="journey-day min-h-svh bg-(--jm-bg) font-sans text-(--jm-ink)">
      <main className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
        <header className="text-center">
          <p className="text-[0.7rem] tracking-[0.38em] text-(--jm-muted) uppercase sm:text-xs">The wedding of</p>
          <h1 className="mt-4 font-serif text-[clamp(2.6rem,7vw,4.8rem)] leading-none">
            {couple.partner1} <span className="font-script text-[0.8em] text-(--jm-accent)">&amp;</span> {couple.partner2}
          </h1>
          <p className="mt-4 font-sans text-lg text-(--jm-muted) sm:text-xl">
            {weddingDate.display}
            <span className="mx-2 text-(--jm-accent)">·</span>
            {location.venue ?? location.city}
          </p>
          <p className="mt-10 text-[0.68rem] tracking-[0.35em] text-(--jm-muted) uppercase">Choose a version</p>
        </header>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {siteVersions.map((version, index) => (
            <li key={version.href}>
              <Link
                href={version.href}
                className="group flex h-full flex-col rounded-[1.4rem] border border-(--jm-line) bg-(--jm-card) p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-(--jm-accent) hover:shadow-[0_24px_50px_-30px_rgba(31,42,68,0.45)] sm:p-7"
              >
                <span className="text-[0.62rem] tracking-[0.3em] text-(--jm-accent) uppercase">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">{version.label}</span>
                <span className="mt-2 flex-1 font-sans text-base leading-relaxed text-(--jm-muted)">
                  {version.description}
                </span>
                <span className="mt-5 inline-flex items-center gap-2 text-[0.68rem] tracking-[0.3em] uppercase transition-colors group-hover:text-(--jm-accent)">
                  Open
                  <span className="block h-px w-6 bg-current transition-all group-hover:w-10" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
