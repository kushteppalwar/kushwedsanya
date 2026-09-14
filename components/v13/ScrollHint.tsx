/**
 * "Scroll down" prompt: a label over a short track with a travelling dot and a
 * nodding chevron. The "auto" variant swaps in a compact pill below the `lg`
 * breakpoint, for when it has to sit just above a card.
 */
export default function ScrollHint({
  label = "Scroll down",
  variant = "auto",
}: {
  label?: string;
  variant?: "auto" | "column";
}) {
  const chevron = (
    <svg
      viewBox="0 0 16 10"
      className="h-2.5 w-4 animate-scroll-hint-nod motion-reduce:animate-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 2 L8 8 L14 2" />
    </svg>
  );

  return (
    <div className="text-(--jm-ink)" aria-hidden="true">
      {variant === "auto" && (
        <div className="flex items-center gap-2.5 rounded-full border border-(--jm-line) bg-(--jm-bg)/90 py-2 pr-4 pl-5 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.5)] lg:hidden">
          <span className="text-xs font-medium tracking-[0.3em] uppercase">{label}</span>
          {chevron}
        </div>
      )}
      <div className={`flex-col items-center gap-2 ${variant === "auto" ? "hidden lg:flex" : "flex"}`}>
        <span className="text-xs font-medium tracking-[0.35em] uppercase">{label}</span>
        <span className="relative h-10 w-px overflow-hidden bg-(--jm-ink)/25">
          <span className="absolute top-0 left-0 h-3 w-px animate-scroll-hint bg-(--jm-accent) motion-reduce:translate-y-7 motion-reduce:animate-none" />
        </span>
        {chevron}
      </div>
    </div>
  );
}
