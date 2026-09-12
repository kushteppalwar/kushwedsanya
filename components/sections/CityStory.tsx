"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  IndiaGate,
  QutubMinar,
  LotusTemple,
  RedFort,
} from "@/components/landmarks/DelhiLandmarks";
import {
  ShaniwarWada,
  AgaKhanPalace,
  SinhagadFort,
  ParvatiHill,
} from "@/components/landmarks/PuneLandmarks";

gsap.registerPlugin(ScrollTrigger);

interface CityStoryProps {
  partner1: string;
  partner2: string;
  city1?: string;
  city2?: string;
}

export default function CityStory({
  partner1,
  partner2,
  city1 = "Delhi",
  city2 = "Pune",
}: CityStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const delhiGroupRef = useRef<HTMLDivElement>(null);
  const puneGroupRef = useRef<HTMLDivElement>(null);
  const city1TitleRef = useRef<HTMLDivElement>(null);
  const city2TitleRef = useRef<HTMLDivElement>(null);
  const mergeTitleRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<SVGSVGElement>(null);

  const dl1 = useRef<SVGSVGElement>(null);
  const dl2 = useRef<SVGSVGElement>(null);
  const dl3 = useRef<SVGSVGElement>(null);
  const dl4 = useRef<SVGSVGElement>(null);
  const pl1 = useRef<SVGSVGElement>(null);
  const pl2 = useRef<SVGSVGElement>(null);
  const pl3 = useRef<SVGSVGElement>(null);
  const pl4 = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const routePath = routeRef.current?.querySelector(
      ".route-path"
    ) as SVGPathElement | null;

    if (prefersReduced) {
      gsap.set(root.querySelectorAll("[data-story]"), {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
      });
      if (routePath) {
        const len = routePath.getTotalLength();
        gsap.set(routePath, { strokeDasharray: len, strokeDashoffset: 0 });
      }
      return;
    }

    const ctx = gsap.context(() => {
      const delhiLandmarks = [dl1.current, dl2.current, dl3.current, dl4.current].filter(
        Boolean
      ) as SVGSVGElement[];
      const puneLandmarks = [pl1.current, pl2.current, pl3.current, pl4.current].filter(
        Boolean
      ) as SVGSVGElement[];
      const delhiGroup = delhiGroupRef.current;
      const puneGroup = puneGroupRef.current;

      gsap.set([city1TitleRef.current, city2TitleRef.current, mergeTitleRef.current], {
        autoAlpha: 0,
        y: 40,
      });
      gsap.set(delhiLandmarks, {
        autoAlpha: 0,
        scale: 0.45,
        y: 95,
        x: -70,
        rotate: -12,
      });
      gsap.set(puneLandmarks, {
        autoAlpha: 0,
        scale: 0.45,
        y: 95,
        x: 70,
        rotate: 12,
      });
      gsap.set(heartRef.current, { autoAlpha: 0, scale: 0.2 });
      gsap.set(puneGroup, { autoAlpha: 0 });
      gsap.set(delhiGroup, { autoAlpha: 1 });

      if (routePath) {
        const length = routePath.getTotalLength();
        gsap.set(routePath, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.1,
        },
      });

      timeline
        .to(city1TitleRef.current, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.06)
        .to(
          delhiLandmarks,
          {
            autoAlpha: 1,
            scale: 1,
            x: 0,
            y: 0,
            rotate: 0,
            duration: 0.48,
            stagger: 0.06,
          },
          0.12
        )
        .to(delhiGroup, { yPercent: -6, duration: 0.55, ease: "none" }, 0.45)
        .to(
          [city1TitleRef.current, ...delhiLandmarks],
          { autoAlpha: 0, y: -34, duration: 0.42 },
          0.95
        )
        .to(delhiGroup, { autoAlpha: 0, duration: 0.08, ease: "none" }, 1.18)
        .to(puneGroup, { autoAlpha: 1, duration: 0.08, ease: "none" }, 1.2);

      if (routePath) {
        timeline.to(
          routePath,
          { strokeDashoffset: 0, duration: 0.72, ease: "none" },
          1.06
        );
      }

      timeline
        .to(city2TitleRef.current, { autoAlpha: 1, y: 0, duration: 0.36 }, 1.32)
        .to(
          puneLandmarks,
          {
            autoAlpha: 1,
            scale: 1,
            x: 0,
            y: 0,
            rotate: 0,
            duration: 0.48,
            stagger: 0.06,
          },
          1.34
        )
        .to(puneGroup, { yPercent: -6, duration: 0.58, ease: "none" }, 1.7)
        .to(
          [city2TitleRef.current, ...puneLandmarks],
          { autoAlpha: 0, y: -30, duration: 0.42 },
          2.05
        )
        .to(puneGroup, { autoAlpha: 0, duration: 0.08, ease: "none" }, 2.22)
        .to(
          mergeTitleRef.current,
          { autoAlpha: 1, y: 0, duration: 0.46, ease: "power3.out" },
          2.25
        )
        .to(
          heartRef.current,
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.4,
            ease: "back.out(2.2)",
          },
          2.34
        );

      gsap.to(heartRef.current, {
        scale: 1.18,
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[320vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_32%,rgba(255,77,141,0.35),transparent_44%),radial-gradient(circle_at_82%_26%,rgba(0,180,216,0.35),transparent_45%),radial-gradient(circle_at_50%_85%,rgba(255,183,3,0.2),transparent_50%)]" />
        <div className="spark-grid absolute inset-0 opacity-35" />

        <div
          ref={city1TitleRef}
          data-story="city1"
          className="absolute top-[10%] left-1/2 z-20 w-full -translate-x-1/2 px-6 text-center opacity-0"
        >
          <p className="font-sans text-xs tracking-[0.52em] text-rose-100 uppercase sm:text-sm">
            {partner1}&apos;s city
          </p>
          <h3 className="mt-2 font-serif text-5xl text-charcoal sm:text-7xl">
            {city1}
          </h3>
        </div>

        <div
          ref={city2TitleRef}
          data-story="city2"
          className="absolute top-[10%] left-1/2 z-20 w-full -translate-x-1/2 px-6 text-center opacity-0"
        >
          <p className="font-sans text-xs tracking-[0.52em] text-cyan-100 uppercase sm:text-sm">
            {partner2}&apos;s city
          </p>
          <h3 className="mt-2 font-serif text-5xl text-charcoal sm:text-7xl">
            {city2}
          </h3>
        </div>

        <div
          ref={delhiGroupRef}
          className="pointer-events-none absolute inset-0"
          data-story="delhi-group"
        >
          <IndiaGate
            ref={dl1}
            data-story="landmark"
            className="absolute top-[20%] left-[8%] h-32 w-32 text-rose-100/80 sm:h-48 sm:w-48"
          />
          <QutubMinar
            ref={dl2}
            data-story="landmark"
            className="absolute top-[16%] right-[10%] h-44 w-24 text-amber-100/80 sm:h-56 sm:w-28"
          />
          <LotusTemple
            ref={dl3}
            data-story="landmark"
            className="absolute bottom-[17%] left-[12%] h-28 w-40 text-rose-100/75 sm:h-40 sm:w-56"
          />
          <RedFort
            ref={dl4}
            data-story="landmark"
            className="absolute right-[8%] bottom-[15%] h-28 w-40 text-amber-100/75 sm:h-40 sm:w-56"
          />
        </div>

        <div
          ref={puneGroupRef}
          className="pointer-events-none absolute inset-0"
          data-story="pune-group"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.22),transparent_55%)]" />
          <ShaniwarWada
            ref={pl1}
            data-story="landmark"
            className="absolute top-[20%] right-[8%] h-36 w-40 text-cyan-50 drop-shadow-[0_0_20px_rgba(103,232,249,0.45)] sm:h-52 sm:w-60"
          />
          <AgaKhanPalace
            ref={pl2}
            data-story="landmark"
            className="absolute top-[18%] left-[9%] h-32 w-44 text-sky-100 drop-shadow-[0_0_20px_rgba(125,211,252,0.4)] sm:h-44 sm:w-60"
          />
          <SinhagadFort
            ref={pl3}
            data-story="landmark"
            className="absolute right-[11%] bottom-[15%] h-36 w-48 text-emerald-100 drop-shadow-[0_0_20px_rgba(167,243,208,0.35)] sm:h-44 sm:w-64"
          />
          <ParvatiHill
            ref={pl4}
            data-story="landmark"
            className="absolute bottom-[16%] left-[10%] h-32 w-32 text-cyan-100 drop-shadow-[0_0_20px_rgba(103,232,249,0.35)] sm:h-44 sm:w-44"
          />
        </div>

        <div className="absolute top-1/2 left-1/2 z-10 w-full max-w-5xl -translate-x-1/2 -translate-y-1/2 px-6">
          <svg
            ref={routeRef}
            className="h-24 w-full sm:h-32"
            viewBox="0 0 760 160"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M35 105 C130 8, 235 144, 380 82 C500 24, 598 134, 725 74"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              className="route-path"
              d="M35 105 C130 8, 235 144, 380 82 C500 24, 598 134, 725 74"
              stroke="url(#route-gradient-main)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="route-gradient-main" x1="35" y1="80" x2="725" y2="80">
                <stop offset="0%" stopColor="#ff4d8d" />
                <stop offset="52%" stopColor="#ffb703" />
                <stop offset="100%" stopColor="#00b4d8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div
          ref={mergeTitleRef}
          data-story="merge"
          className="absolute top-1/2 left-1/2 z-20 w-full -translate-x-1/2 -translate-y-1/2 px-6 text-center opacity-0"
        >
          <p className="font-sans text-xs tracking-[0.45em] text-amber-100 uppercase sm:text-sm">
            Two places, one celebration
          </p>
          <h3 className="mt-3 font-serif text-4xl text-charcoal sm:text-6xl">
            {partner1} <span className="text-gold">&amp;</span> {partner2}
          </h3>
          <p className="mt-3 font-sans text-lg text-warm-gray sm:text-2xl">
            One beautiful journey, unfolding as you scroll.
          </p>

          <div
            ref={heartRef}
            data-story="heart"
            className="relative mx-auto mt-6 w-fit opacity-0"
          >
            <div className="pulse-glow absolute inset-0 -m-5 rounded-full bg-amber-200/30 blur-2xl" />
            <svg
              className="relative h-16 w-16 text-gold sm:h-20 sm:w-20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
