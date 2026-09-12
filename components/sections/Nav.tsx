import Countdown from "@/components/sections/Countdown";

interface NavProps {
  partner1: string;
  partner2: string;
  countdownTarget?: string;
}

const links = [
  { href: "#schedule", label: "Schedule" },
  { href: "#venue", label: "Venue" },
];

export default function Nav({ partner1, partner2, countdownTarget }: NavProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-ink/10 bg-paper/70 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
        <a href="#top" className="font-serif text-lg tracking-wide text-ink">
          {partner1.charAt(0)}
          <span className="mx-0.5 text-wine">&amp;</span>
          {partner2.charAt(0)}
        </a>

        <ul className="hidden items-center gap-8 sm:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-xs tracking-[0.3em] text-ink-soft uppercase transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {countdownTarget && (
          <div className="flex items-center gap-2 rounded-full border border-ink/15 px-3.5 py-1.5 text-sm text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-wine" aria-hidden="true" />
            <Countdown target={countdownTarget} />
          </div>
        )}
      </nav>
    </header>
  );
}
