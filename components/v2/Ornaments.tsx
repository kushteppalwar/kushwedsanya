type SvgProps = { className?: string };

/** A curling sprig for the corners of the invitation card. Default orientation: top-left. */
export function CornerSprig({ className = "" }: SvgProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 114 C 22 82, 36 60, 62 42 S 96 14, 114 6" />
      <path d="M40 60 c -14 -2, -22 -12, -20 -26 c 12 4, 20 14, 20 26z" />
      <path d="M62 42 c -4 -14, 2 -26, 14 -32 c 2 14, -4 26, -14 32z" />
      <path d="M84 24 c -2 -10, 4 -18, 12 -20 c 0 10, -4 18, -12 20z" />
      <path d="M26 86 c -12 2, -20 -4, -22 -14 c 10 -2, 18 4, 22 14z" />
      <path d="M48 52 c 8 6, 10 14, 6 22" />
      <path d="M70 34 c 8 2, 14 8, 14 16" />
      <circle cx="102" cy="14" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="94" cy="30" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16" cy="98" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="56" cy="78" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Soft mandala used behind the monogram and as a section watermark. */
export function Mandala({ className = "" }: SvgProps) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      className={className}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="92" strokeDasharray="2 5" />
      <circle cx="100" cy="100" r="78" />
      <circle cx="100" cy="100" r="46" />
      <circle cx="100" cy="100" r="30" strokeDasharray="1 4" />
      {petals.map((angle) => (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <path d="M100 22 c 10 14, 10 30, 0 44 c -10 -14, -10 -30, 0 -44z" />
          <path d="M100 56 c 5 8, 5 16, 0 24 c -5 -8, -5 -16, 0 -24z" opacity="0.7" />
          <circle cx="100" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </g>
      ))}
    </svg>
  );
}

/** Line — leaf — line divider. */
export function LeafDivider({ className = "" }: SvgProps) {
  return (
    <svg
      viewBox="0 0 240 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M0 12 H 92" />
      <path d="M148 12 H 240" />
      <path d="M120 4 c 8 2, 12 6, 12 8 c -4 2, -8 2, -12 -2z" />
      <path d="M120 20 c -8 -2, -12 -6, -12 -8 c 4 -2, 8 -2, 12 2z" />
      <path d="M104 12 c 6 -6, 10 -6, 16 0" />
      <path d="M120 12 c 6 6, 10 6, 16 0" />
      <circle cx="120" cy="12" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

const icons: Record<string, React.ReactNode> = {
  sakharpuda: (
    <>
      <circle cx="9" cy="14" r="5.5" />
      <circle cx="15" cy="14" r="5.5" />
      <path d="M9 8.5 l 2 -3 h 2 l 2 3" />
    </>
  ),
  sangeet: (
    <>
      <path d="M9 18 V 6 l 10 -2 v 12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </>
  ),
  haldi: (
    <>
      <circle cx="12" cy="12" r="3" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <path key={angle} d="M12 9 c 2 -3, 2 -6, 0 -7 c -2 1, -2 4, 0 7z" transform={`rotate(${angle} 12 12)`} />
      ))}
    </>
  ),
  wedding: (
    <>
      <path d="M4 20 V 10 c 0 -4, 3.5 -6, 8 -6 s 8 2, 8 6 v 10" />
      <path d="M4 20 h 16" />
      <path d="M12 20 v -5" />
      <path d="M12 12 c 1.5 -1.5, 1.5 -3, 0 -4.5 c -1.5 1.5, -1.5 3, 0 4.5z" />
    </>
  ),
};

const flute = (
  <>
    <path d="M-2 -6 h4 l-0.8 6 a1.2 1.2 0 0 1 -2.4 0z" />
    <path d="M0 0 v6" />
    <path d="M-2.2 6 h4.4" />
  </>
);

icons.reception = (
  <>
    <g transform="translate(8.5 10) rotate(-14)">{flute}</g>
    <g transform="translate(15.5 10) rotate(14)">{flute}</g>
    <path d="M12 2.5 v1.6 M11.2 3.3 h1.6" />
  </>
);

const fallbackIcon = (
  <path d="M12 3 l 2.2 6.8 L 21 12 l -6.8 2.2 L 12 21 l -2.2 -6.8 L 3 12 l 6.8 -2.2z" />
);

export function CeremonyIcon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name.toLowerCase()] ?? fallbackIcon}
    </svg>
  );
}
