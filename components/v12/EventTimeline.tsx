"use client";

import { useEffect, useRef } from "react";
import Reveal from "@/components/animation/Reveal";
import { CeremonyIcon } from "@/components/v2/Ornaments";
import type { TimelineStop } from "@/lib/timeline";

interface EventTimelineProps {
  stops: TimelineStop[];
  title: string;
  /** Small line under the heading, e.g. that attire notes are only suggestions. */
  note?: string;
}

export default function EventTimeline({
  stops,
  title,
  note,
}: EventTimelineProps) {
  const lineRef = useRef<HTMLDivElement>(null);
  const drawnRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const ringRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const line = lineRef.current;
    if (!line) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let target = 0;
    let current = 0;
    let frame = 0;

    const readTarget = () => {
      const rect = line.getBoundingClientRect();
      // The line is "drawn" down to a point 62% of the way down the viewport.
      return Math.min(
        1,
        Math.max(0, (window.innerHeight * 0.62 - rect.top) / rect.height),
      );
    };

    const render = (progress: number) => {
      const height = line.clientHeight;
      if (drawnRef.current)
        drawnRef.current.style.transform = `scaleY(${progress})`;
      if (planeRef.current) {
        planeRef.current.style.transform = `translate(-50%, ${progress * height}px) translateY(-50%)`;
        planeRef.current.style.opacity =
          progress > 0.01 && progress < 0.99 ? "1" : "0";
      }
      const lineTop = line.getBoundingClientRect().top;
      ringRefs.current.forEach((ring) => {
        if (!ring) return;
        const box = ring.getBoundingClientRect();
        const centre = box.top + box.height / 2 - lineTop;
        ring.dataset.reached = centre <= progress * height ? "true" : "false";
      });
    };

    const tick = () => {
      frame = 0;
      current += (target - current) * (reduced ? 1 : 0.18);
      if (Math.abs(target - current) < 0.0005) current = target;
      render(current);
      if (current !== target) frame = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = readTarget();
      if (document.hidden || reduced) {
        current = target;
        render(current);
        return;
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [stops]);

  const groupStarts = stops.map(
    (stop, index) => index === 0 || stops[index - 1].group !== stop.group,
  );

  return (
    <section
      id="itinerary"
      className="scroll-mt-10 bg-(--jm-bg-deep)/60 px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-4xl">
        <Reveal className="text-center">
          <p className="text-[0.65rem] tracking-[0.35em] text-(--jm-muted) uppercase sm:text-xs">
            The itinerary
          </p>
          <h2 className="mt-3 font-serif text-[clamp(2rem,6vw,4rem)] leading-none text-(--jm-ink) text-balance">
            {title}
          </h2>
          {note && (
            <p className="mx-auto mt-4 max-w-md font-sans text-base text-(--jm-muted) italic sm:text-lg">
              {note}
            </p>
          )}
        </Reveal>

        <div className="relative mt-12 sm:mt-16">
          {/* The route: a faint dashed base, a solid line that draws as you scroll, and a plane on its tip */}
          <div
            ref={lineRef}
            className="absolute top-2 bottom-2 left-6 w-px border-l border-dashed border-(--jm-ink)/30 md:left-1/2 md:-translate-x-1/2"
            aria-hidden="true"
          >
            <div
              ref={drawnRef}
              className="absolute inset-x-[-1.5px] top-0 bottom-0 origin-top rounded-full bg-(--jm-accent)"
              style={{ transform: "scaleY(0)" }}
            />
            <div
              ref={planeRef}
              className="absolute top-0 left-1/2 h-6 w-6 text-(--jm-ink) transition-opacity duration-300"
              style={{
                transform: "translate(-50%, 0) translateY(-50%)",
                opacity: 0,
              }}
            >
              <svg
                viewBox="-16 -16 32 32"
                className="h-full w-full rotate-90"
                aria-hidden="true"
              >
                <path d="M-14 -9 L14 0 L-14 9 L-7 0 Z" fill="currentColor" />
                <path d="M-7 0 L-14 9 L-10 0 Z" fill="var(--jm-accent)" />
              </svg>
            </div>
          </div>

          <ol className="space-y-8 sm:space-y-10">
            {stops.map((stop, index) => {
              const newGroup = groupStarts[index];
              const left = index % 2 === 0;

              return (
                <li key={`${stop.group}-${stop.name}`} className="relative">
                  {newGroup && (
                    <Reveal className="relative mb-6 pl-14 md:mb-8 md:pl-0 md:text-center">
                      <span className="inline-block rounded-full border border-(--jm-accent)/50 bg-(--jm-bg) px-3.5 py-1 text-[0.62rem] tracking-[0.3em] text-(--jm-accent) uppercase">
                        {stop.group}
                        {stop.date && ` · ${stop.date}`}
                      </span>
                    </Reveal>
                  )}

                  <div className="relative md:grid md:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] md:items-center">
                    {/* Milestone ring */}
                    <span
                      ref={(el) => {
                        ringRefs.current[index] = el;
                      }}
                      data-reached="false"
                      className="absolute top-5 left-6 z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border-2 border-(--jm-accent)/40 bg-(--jm-bg) text-(--jm-accent) transition-[border-color,box-shadow,transform] duration-500 data-[reached=true]:scale-110 data-[reached=true]:border-(--jm-accent) data-[reached=true]:shadow-[0_0_0_6px_color-mix(in_srgb,var(--jm-accent)_18%,transparent)] md:static md:col-start-2 md:translate-x-0 md:justify-self-center"
                    >
                      <CeremonyIcon
                        name={stop.name}
                        icon={stop.icon}
                        className="h-5 w-5"
                      />
                    </span>

                    <Reveal
                      direction={left ? "right" : "left"}
                      className={`pl-14 md:pl-0 ${left ? "md:col-start-1 md:row-start-1 md:pr-8 md:text-right" : "md:col-start-3 md:row-start-1 md:pl-8"}`}
                    >
                      <article className="rounded-2xl border border-(--jm-line) bg-(--jm-card) p-5 sm:p-6">
                        <p className="text-[0.6rem] tracking-[0.3em] text-(--jm-muted) uppercase">
                          Stop {String(index + 1).padStart(2, "0")}
                          {stop.time && ` · ${stop.time}`}
                        </p>
                        <h3 className="mt-1.5 font-serif text-2xl leading-tight text-(--jm-ink) text-balance sm:text-3xl">
                          {stop.name}
                        </h3>
                        <p className="mt-1.5 font-sans text-base text-(--jm-muted) sm:text-lg">
                          {stop.hall && (
                            <span className="text-(--jm-ink)">
                              {stop.hall},{" "}
                            </span>
                          )}
                          {[stop.venue, stop.city].filter(Boolean).join(" · ")}
                        </p>
                        {stop.attire && (
                          <dl
                            className={`mt-4 space-y-1 border-t border-dashed border-(--jm-line) pt-3 text-[0.9rem] leading-snug text-(--jm-muted) ${left ? "md:[&>div]:flex-row-reverse" : ""}`}
                          >
                            {(
                              [
                                ["Everyone", stop.attire.all],
                                ["Women", stop.attire.women],
                                ["Men", stop.attire.men],
                              ] as const
                            )
                              .filter(([, value]) => value)
                              .map(([who, value]) => (
                                <div key={who} className="flex gap-2">
                                  <dt className="shrink-0 text-[0.6rem] leading-[1.9] tracking-[0.25em] text-(--jm-accent)/80 uppercase">
                                    {who}
                                  </dt>
                                  <dd className="italic">{value}</dd>
                                </div>
                              ))}
                          </dl>
                        )}
                      </article>
                    </Reveal>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
