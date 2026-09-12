import Reveal from "@/components/animation/Reveal";
import { CornerSprig, LeafDivider, Mandala } from "@/components/v2/Ornaments";
import type { EventConfig } from "@/lib/content";

interface InvitationCardProps {
  config: EventConfig;
  calendarHref?: string;
  calendarFileName?: string;
}

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-xs tracking-[0.28em] uppercase transition-all duration-300 sm:text-[0.8rem]";
export const buttonPrimary = `${buttonBase} bg-rani text-cream-v2 shadow-[0_10px_30px_-12px_rgba(143,29,63,0.7)] hover:bg-rani-deep hover:shadow-[0_14px_34px_-12px_rgba(97,18,41,0.8)]`;
export const buttonOutline = `${buttonBase} border border-rani/50 text-rani hover:border-rani hover:bg-rani/5`;

const corners = [
  "top-3 left-3",
  "top-3 right-3 -scale-x-100",
  "bottom-3 left-3 -scale-y-100",
  "right-3 bottom-3 -scale-100",
];

export default function InvitationCard({ config, calendarHref, calendarFileName }: InvitationCardProps) {
  const { couple, weddingDate, location, invitation } = config;

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
      <Reveal direction="none" duration={1.6} className="w-full max-w-3xl">
        <div className="card-frame bg-cream-v2/95 px-6 pt-10 pb-14 text-center shadow-[0_30px_80px_-40px_rgba(59,42,38,0.45)] sm:px-14 sm:py-12">
          {corners.map((position) => (
            <CornerSprig
              key={position}
              className={`pointer-events-none absolute h-14 w-14 text-turmeric/80 sm:h-28 sm:w-28 ${position}`}
            />
          ))}

          <div className="relative">
            <div className="relative mx-auto mb-6 h-24 w-24 sm:h-28 sm:w-28">
              <Mandala className="animate-shimmer absolute inset-0 text-turmeric" />
              <span className="absolute inset-0 flex items-center justify-center font-script text-4xl text-rani sm:text-5xl">
                {couple.partner1.charAt(0)}
                <span className="mx-1 text-2xl text-turmeric sm:text-3xl">&amp;</span>
                {couple.partner2.charAt(0)}
              </span>
            </div>

            {invitation && (
              <p className="text-[0.7rem] tracking-[0.38em] text-cocoa-soft uppercase sm:text-xs">
                {invitation.intro}
              </p>
            )}

            <h1 className="mt-4 font-script text-[clamp(3.4rem,12vw,6rem)] leading-[1.05] text-rani">
              {couple.partner1}
              <span className="mx-3 text-[0.6em] text-turmeric sm:mx-5">&amp;</span>
              {couple.partner2}
            </h1>

            {invitation && (
              <p className="mx-auto mt-5 max-w-md font-sans text-lg leading-relaxed italic text-cocoa-soft sm:text-xl">
                {invitation.request}
              </p>
            )}

            <LeafDivider className="mx-auto my-7 h-6 w-56 text-turmeric" />

            <div className="flex items-center justify-center gap-5 sm:gap-8">
              <p className="hidden w-32 border-y border-turmeric/50 py-2 text-[0.7rem] tracking-[0.3em] text-cocoa uppercase sm:block">
                {weddingDate.dayOfWeek.split("–")[0]?.trim()}
              </p>
              <p className="font-serif text-6xl leading-none text-cocoa tabular-nums">
                {weddingDate.startDay}
                {weddingDate.endDay && (
                  <>
                    <span className="mx-2 text-3xl text-turmeric sm:text-4xl">–</span>
                    {weddingDate.endDay}
                  </>
                )}
              </p>
              <p className="hidden w-32 border-y border-turmeric/50 py-2 text-[0.7rem] tracking-[0.3em] text-cocoa uppercase sm:block">
                {weddingDate.dayOfWeek.split("–")[1]?.trim() ?? weddingDate.month}
              </p>
            </div>
            <p className="mt-4 text-[0.75rem] tracking-[0.38em] text-cocoa uppercase sm:text-sm">
              {weddingDate.month} {weddingDate.year}
            </p>
            <p className="mt-1 text-xs tracking-[0.25em] text-cocoa-soft uppercase sm:hidden">
              {weddingDate.dayOfWeek}
            </p>

            <p className="mt-7 font-serif text-xl text-cocoa sm:text-2xl">{location.venue ?? location.city}</p>
            <p className="mt-1 font-sans text-lg text-cocoa-soft">
              {[location.venue && location.city, location.country].filter(Boolean).join(", ")}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href="#celebrations" className={buttonPrimary}>
                The celebrations
              </a>
              {calendarHref && (
                <a href={calendarHref} download={calendarFileName} className={buttonOutline}>
                  Add to calendar
                </a>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
