"use client";

import { useRef, useEffect, useLayoutEffect, useCallback, forwardRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { EventLocation, ScheduleDay } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);
// Mobile browsers resize the viewport as the address bar collapses mid-scroll;
// without this the pinned section would re-measure and jump on every toggle.
ScrollTrigger.config({ ignoreMobileResize: true });

const UNROLL_START = 0.18;
const UNROLL_END = 0.92;

interface AncientScrollProps {
  tagline: string;
  partner1: string;
  partner2: string;
  dateDisplay: string;
  schedule?: ScheduleDay[];
  location?: EventLocation;
  directionsUrl?: string;
  calendarHref?: string;
  calendarFileName?: string;
  closing?: {
    message?: string;
    signoff?: string;
  };
}

const inkLink =
  "inline-flex items-center gap-1.5 font-serif text-[0.78rem] tracking-[0.12em] text-amber-900/85 uppercase underline decoration-amber-700/40 underline-offset-4 transition-colors hover:text-amber-950 hover:decoration-amber-800/70 sm:text-xs";

function Ornament({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      className={`h-5 w-44 text-amber-800/45 ${flip ? "rotate-180" : ""}`}
      viewBox="0 0 200 30"
      aria-hidden="true"
    >
      <path d="M 10 15 Q 30 5, 50 15 T 90 15" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="100" cy="15" r="3.5" fill="currentColor" />
      <path d="M 110 15 Q 130 25, 150 15 T 190 15" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M 0 15 L 10 15" stroke="currentColor" strokeWidth="1" />
      <path d="M 190 15 L 200 15" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

const Roll = forwardRef<HTMLDivElement, { position: "top" | "bottom" }>(
  function Roll({ position }, ref) {
    return (
      <div ref={ref} className={`scroll-roll scroll-roll--${position}`}>
        <span className="scroll-roll__cap scroll-roll__cap--left" />
        <span className="scroll-roll__cap scroll-roll__cap--right" />
      </div>
    );
  }
);

export default function AncientScroll({
  tagline,
  partner1,
  partner2,
  dateDisplay,
  schedule,
  location,
  directionsUrl,
  calendarHref,
  calendarFileName,
  closing,
}: AncientScrollProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const assemblyRef = useRef<HTMLDivElement>(null);
  const topRollRef = useRef<HTMLDivElement>(null);

  // Kept in a ref, not state: the ScrollTrigger must be built once and never
  // torn down, since recreating it mid-scroll recomputes a wrong start offset.
  const paperHeightRef = useRef(0);
  const refreshTimerRef = useRef(0);

  // Coalesces bursts of resize notifications into one refresh, outside the
  // ResizeObserver callback so the refresh's own layout work can't feed back
  // into it. A timeout rather than requestAnimationFrame so the initial
  // refresh still runs when the page is opened in a background tab.
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) return;
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = 0;
      ScrollTrigger.refresh();
    }, 0);
  }, []);

  // offsetHeight ignores the --fit transform, so every measurement here stays
  // in unscaled space and the unroll math is unaffected by the scaling.
  const measure = useCallback(() => {
    const section = sectionRef.current;
    const sheet = sheetRef.current;
    const roll = topRollRef.current;
    const assembly = assemblyRef.current;
    if (!section || !sheet || !roll || !assembly) return;

    const naturalHeight = sheet.offsetHeight + roll.offsetHeight * 2;
    const fit = Math.min(1, (section.clientHeight * 0.94) / naturalHeight);
    assembly.style.setProperty("--fit", fit.toFixed(4));

    if (sheet.offsetHeight === paperHeightRef.current) return;
    paperHeightRef.current = sheet.offsetHeight;
    scheduleRefresh();
  }, [scheduleRefresh]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const sheet = sheetRef.current;
    if (!section || !sheet) return;

    measure();

    // The section tracks the viewport, so observing it covers resizes and
    // orientation changes; the sheet covers content reflow such as font loads.
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(sheet);

    return () => {
      observer.disconnect();
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = 0;
    };
  }, [measure]);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      gsap.set(windowRef.current, { height: paperHeightRef.current });
      gsap.set([sealRef.current, glowRef.current, hintRef.current], { opacity: 0 });
      return;
    }

    // A reload restores the previous scroll position, which would build the
    // pinned trigger from a mid-scroll offset. The scroll always starts closed.
    window.scrollTo(0, 0);

    const ctx = gsap.context(() => {
      gsap.set(windowRef.current, { height: 0 });
      gsap.set(sealRef.current, { opacity: 1, scale: 1, rotation: 0 });
      gsap.set(glowRef.current, { opacity: 0, scale: 0.8 });
      gsap.set(hintRef.current, { opacity: 1, y: 0 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * 3.2}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const unrolled = gsap.utils.clamp(
              0,
              1,
              (self.progress - UNROLL_START) / (UNROLL_END - UNROLL_START)
            );
            gsap.set(windowRef.current, { height: unrolled * paperHeightRef.current });
          },
        },
      });

      // Spacer tween fixes the timeline duration at 1 so the positions below
      // read as fractions of scroll progress.
      timeline
        .to({ t: 0 }, { t: 1, duration: 1, ease: "none" }, 0)
        .to(hintRef.current, { opacity: 0, y: 16, duration: 0.04 }, 0)
        .to(glowRef.current, { opacity: 0.7, scale: 1.4, duration: 0.06 }, 0)
        .to(sealRef.current, { rotation: -5, duration: 0.015 }, 0.04)
        .to(sealRef.current, { rotation: 5, scale: 1.06, duration: 0.015 }, 0.055)
        .to(sealRef.current, { rotation: -3, scale: 1.1, duration: 0.015 }, 0.07)
        .to(sealRef.current, { rotation: 0, duration: 0.015 }, 0.085)
        .to(sealRef.current, { scale: 1.5, opacity: 0, duration: 0.05 }, 0.1)
        .to(glowRef.current, { opacity: 0, scale: 2.2, duration: 0.06 }, 0.12);
    }, sectionRef);

    scheduleRefresh();

    return () => ctx.revert();
  }, [scheduleRefresh]);

  return (
    <section
      ref={sectionRef}
      className="scroll-section relative h-[100svh] overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(180,140,80,0.08),transparent)]" />
        <div className="parchment-bg-texture absolute inset-0 opacity-[0.03]" />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          ref={glowRef}
          className="h-[360px] w-[360px] rounded-full opacity-0"
          style={{
            background:
              "radial-gradient(circle, rgba(201,162,39,0.45) 0%, rgba(180,140,80,0.18) 35%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </div>

      {/* Fixed-size stage: the assembly grows inside it without resizing the pinned section */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div
          ref={assemblyRef}
          className="scroll-assembly flex w-[min(34rem,92vw)] flex-col items-stretch [--roll-h:clamp(1.6rem,5.5vw,2.6rem)] short:w-[min(56rem,94vw)] short:[--roll-h:clamp(1.4rem,5vh,2.2rem)]"
        >
          <Roll ref={topRollRef} position="top" />

          <div ref={windowRef} className="scroll-window relative overflow-hidden">
            <div ref={sheetRef} className="scroll-sheet absolute inset-x-0 top-0">
              <div className="parchment-texture pointer-events-none absolute inset-0 opacity-[0.35]" />

              <div className="relative flex flex-col items-center px-6 py-7 text-center sm:px-10 sm:py-9 short:flex-row short:items-center short:gap-10 short:px-12 short:py-6">
                <div className="flex flex-col items-center short:flex-1">
                  <Ornament />

                  <p className="mt-5 font-serif text-[0.7rem] tracking-[0.42em] text-amber-800/80 uppercase sm:text-xs">
                    {tagline}
                  </p>

                  <h1 className="ancient-text mt-4 font-serif text-[clamp(1.9rem,6vw,2.9rem)] leading-tight font-light tracking-wide text-amber-950 short:text-[2.6rem]">
                    {partner1}
                  </h1>

                  <div className="my-1.5 flex items-center gap-3">
                    <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-700/40" />
                    <span className="font-serif text-xl italic text-amber-700">&amp;</span>
                    <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-700/40" />
                  </div>

                  <h1 className="ancient-text font-serif text-[clamp(1.9rem,6vw,2.9rem)] leading-tight font-light tracking-wide text-amber-950 short:text-[2.6rem]">
                    {partner2}
                  </h1>

                  <p className="mt-5 border-y border-amber-700/30 px-6 py-2 font-serif text-[clamp(0.85rem,2.6vw,1.05rem)] tracking-[0.1em] text-amber-900 short:text-base">
                    {dateDisplay}
                  </p>
                </div>

                <div className="flex flex-col items-center short:flex-1">
                  {schedule && schedule.length > 0 && (
                    <div className="mt-6 w-full max-w-[22rem] space-y-4 short:mt-0">
                      {schedule.map((day) => (
                        <div key={day.day}>
                          <div className="mb-2 flex items-center justify-center gap-2.5">
                            <span className="h-px flex-1 bg-amber-700/25" />
                            <span className="font-serif text-[0.62rem] tracking-[0.3em] text-amber-800/85 uppercase whitespace-nowrap">
                              {day.day}
                              {day.date && ` · ${day.date}`}
                            </span>
                            <span className="h-px flex-1 bg-amber-700/25" />
                          </div>

                          <ul className="space-y-1">
                            {day.events.map((event) => (
                              <li
                                key={event.name}
                                className="flex items-baseline gap-2 font-serif text-amber-900"
                              >
                                <span className="text-[clamp(0.9rem,2.7vw,1.05rem)] tracking-wide short:text-base">
                                  {event.name}
                                </span>
                                <span className="mb-[3px] flex-1 border-b border-dotted border-amber-700/35" />
                                <span className="text-[clamp(0.78rem,2.3vw,0.9rem)] tracking-[0.08em] text-amber-800/90 tabular-nums short:text-sm">
                                  {event.time}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {location && (
                    <div className="mt-6 short:mt-4">
                      {location.venue && (
                        <p className="ancient-text font-serif text-[clamp(1rem,3vw,1.2rem)] tracking-[0.06em] text-amber-950">
                          {location.venue}
                        </p>
                      )}
                      <p className="mt-1 font-serif text-[0.8rem] text-amber-800/70 sm:text-sm">
                        {[location.city, location.state, location.country].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  )}

                  {(directionsUrl || calendarHref) && (
                    <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                      {directionsUrl && (
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={inkLink}
                        >
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-5.4-6-11a6 6 0 1 1 12 0c0 5.6-6 11-6 11Z" />
                            <circle cx="12" cy="10" r="2.2" />
                          </svg>
                          Get directions
                        </a>
                      )}
                      {calendarHref && (
                        <a href={calendarHref} download={calendarFileName} className={inkLink}>
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                            <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
                            <path strokeLinecap="round" d="M3.5 9.5h17M8 3v4M16 3v4" />
                          </svg>
                          Add to calendar
                        </a>
                      )}
                    </div>
                  )}

                  {closing?.message && (
                    <p className="mt-4 max-w-[20rem] font-serif text-[0.72rem] leading-relaxed text-amber-800/60 sm:text-xs short:mt-2.5">
                      {closing.message}
                    </p>
                  )}

                  {closing?.signoff && (
                    <p className="mt-2.5 font-serif text-[0.85rem] italic text-amber-800/80 sm:text-sm short:mt-1.5">
                      {closing.signoff}
                    </p>
                  )}

                  <div className="mt-5 short:mt-3">
                    <Ornament flip />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Roll position="bottom" />
        </div>
      </div>

      {/* Wax seal — sits over the closed scroll and breaks as it opens */}
      <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
        <div ref={sealRef} className="relative h-16 w-16 sm:h-20 sm:w-20">
          <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-2xl">
            <defs>
              <radialGradient id="waxGrad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="40%" stopColor="#991b1b" />
                <stop offset="100%" stopColor="#450a0a" />
              </radialGradient>
            </defs>
            <path
              d="M 50 8 Q 72 10, 88 28 Q 96 48, 92 65 Q 86 82, 68 90 Q 50 95, 32 90 Q 14 82, 8 65 Q 4 48, 12 28 Q 28 10, 50 8"
              fill="url(#waxGrad)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-red-400/30 bg-gradient-to-br from-red-600/90 to-red-900/90 shadow-inner sm:h-11 sm:w-11">
              <span className="font-serif text-sm font-semibold tracking-tight text-red-100/90 sm:text-base">
                {partner1.charAt(0)}
                {partner2.charAt(0)}
              </span>
            </div>
          </div>
          <div className="absolute top-2.5 left-2.5 h-3 w-3 rounded-full bg-gradient-to-br from-red-300/60 to-transparent blur-[2px]" />
        </div>
      </div>

      <div ref={hintRef} className="pointer-events-none absolute bottom-8 left-1/2 z-50 -translate-x-1/2">
        <div className="flex flex-col items-center gap-3">
          <span className="font-serif text-xs tracking-[0.3em] text-amber-300/50 uppercase sm:text-sm">
            Scroll to unfurl
          </span>
          <div className="flex animate-bounce flex-col items-center gap-1">
            <div className="h-6 w-px bg-gradient-to-b from-amber-400/60 to-amber-400/20" />
            <svg
              className="h-4 w-4 text-amber-400/50"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
