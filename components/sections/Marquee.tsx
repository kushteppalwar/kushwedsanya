interface MarqueeProps {
  items: string[];
}

export default function Marquee({ items }: MarqueeProps) {
  const track = [...items, ...items];

  return (
    <div
      className="overflow-hidden border-y border-ink/15 bg-ink py-3 text-paper"
      aria-label={items.join(", ")}
    >
      <div className="animate-marquee flex w-max whitespace-nowrap">
        {track.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center font-serif text-lg tracking-[0.18em] uppercase sm:text-xl"
            aria-hidden={index >= items.length}
          >
            <span className="px-6">{item}</span>
            <span className="text-brass" aria-hidden="true">
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
