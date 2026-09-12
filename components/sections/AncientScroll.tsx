"use client";

import { useRef, useEffect, useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ParchmentScene = dynamic(
  () => import("@/components/webgl/ParchmentScene"),
  { ssr: false }
);

interface AncientScrollProps {
  tagline: string;
  partner1: string;
  partner2: string;
  dateDisplay: string;
  city1?: string;
  city2?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  closing?: {
    message?: string;
    signoff?: string;
  };
}

export default function AncientScroll({
  tagline,
  partner1,
  partner2,
  dateDisplay,
  city1 = "Delhi",
  city2 = "Pune",
  location,
  closing,
}: AncientScrollProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  const sealRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const debrisRef = useRef<HTMLDivElement>(null);
  const leftRopeRef = useRef<SVGPathElement>(null);
  const rightRopeRef = useRef<SVGPathElement>(null);
  const contentBand1Ref = useRef<HTMLDivElement>(null);
  const contentBand2Ref = useRef<HTMLDivElement>(null);
  const contentBand3Ref = useRef<HTMLDivElement>(null);
  const contentBand4Ref = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  const hazeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
    setIsLoaded(true);
  }, []);

  const handleProgress = useCallback((p: number) => {
    setScrollProgress(p);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced || !webglSupported) {
      setScrollProgress(1);
      gsap.set(
        [contentBand1Ref.current, contentBand2Ref.current, contentBand3Ref.current, contentBand4Ref.current],
        { opacity: 1, y: 0, filter: "blur(0px)" }
      );
      gsap.set(sealRef.current, { opacity: 0 });
      gsap.set(scrollHintRef.current, { opacity: 0 });
      gsap.set([glowRef.current, hazeRef.current], { opacity: 0 });
      if (debrisRef.current) {
        Array.from(debrisRef.current.children).forEach((el) => gsap.set(el, { opacity: 0 }));
      }
      if (leftRopeRef.current) gsap.set(leftRopeRef.current, { opacity: 0 });
      if (rightRopeRef.current) gsap.set(rightRopeRef.current, { opacity: 0 });
      return;
    }

    gsap.set(sealRef.current, { scale: 1, opacity: 1, rotation: 0 });
    gsap.set(glowRef.current, { opacity: 0, scale: 0.8 });
    gsap.set(scrollHintRef.current, { opacity: 1 });
    gsap.set(hazeRef.current, { opacity: 0 });

    if (debrisRef.current) {
      Array.from(debrisRef.current.children).forEach((el) => {
        gsap.set(el, { opacity: 0, scale: 0 });
      });
    }

    const contentBands = [
      contentBand1Ref.current,
      contentBand2Ref.current,
      contentBand3Ref.current,
      contentBand4Ref.current,
    ];
    contentBands.forEach((band) => {
      if (band) gsap.set(band, { opacity: 0, y: 25, filter: "blur(6px)" });
    });

    const ctx = gsap.context(() => {
      const progressObj = { value: 0 };

      const mainTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=400%",
          scrub: 1.5,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            handleProgress(self.progress);
          },
        },
      });

      // ── Phase 1: idle + glow build (0–8%) ──
      mainTl.to(
        glowRef.current,
        { opacity: 0.6, scale: 1.3, duration: 0.08, ease: "power2.out" },
        0
      );
      mainTl.to(
        scrollHintRef.current,
        { opacity: 0, y: 20, duration: 0.06, ease: "power2.in" },
        0.02
      );

      // ── Phase 2: seal trembles and cracks (8–20%) ──
      mainTl
        .to(sealRef.current, { rotation: -4, duration: 0.02, ease: "power1.inOut" }, 0.08)
        .to(sealRef.current, { rotation: 5, duration: 0.02, ease: "power1.inOut" }, 0.10)
        .to(sealRef.current, { rotation: -3, scale: 1.08, duration: 0.02, ease: "power1.inOut" }, 0.12)
        .to(sealRef.current, { rotation: 2, scale: 1.12, duration: 0.02, ease: "power1.inOut" }, 0.14)
        .to(sealRef.current, { rotation: -1, duration: 0.01, ease: "power1.inOut" }, 0.16);

      // ── Phase 3: seal breaks, ropes loosen (20–30%) ──
      mainTl.to(
        sealRef.current,
        { scale: 1.4, opacity: 0, duration: 0.06, ease: "power3.out" },
        0.20
      );
      mainTl.to(
        glowRef.current,
        { opacity: 1, scale: 1.8, duration: 0.05, ease: "power2.out" },
        0.20
      );
      mainTl.to(
        glowRef.current,
        { opacity: 0, scale: 2.5, duration: 0.08, ease: "power2.out" },
        0.25
      );
      mainTl.to(
        leftRopeRef.current,
        {
          attr: { d: "M 80 0 Q 20 60, -30 170 Q -60 280, -120 400" },
          opacity: 0,
          duration: 0.08,
          ease: "power2.in",
        },
        0.22
      );
      mainTl.to(
        rightRopeRef.current,
        {
          attr: { d: "M 80 0 Q 140 60, 190 170 Q 220 280, 280 400" },
          opacity: 0,
          duration: 0.08,
          ease: "power2.in",
        },
        0.22
      );

      // Seal debris burst
      if (debrisRef.current) {
        Array.from(debrisRef.current.children).forEach((el, i) => {
          const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
          const dist = 40 + Math.random() * 60;
          mainTl.to(
            el,
            {
              opacity: 0.9,
              scale: 1,
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist - 20,
              rotation: Math.random() * 360,
              duration: 0.06,
              ease: "power2.out",
            },
            0.20
          );
          mainTl.to(
            el,
            { opacity: 0, y: `+=${40 + Math.random() * 30}`, duration: 0.08, ease: "power1.in" },
            0.26
          );
        });
      }

      // Depth haze breathes in during unfurl
      mainTl.to(
        hazeRef.current,
        { opacity: 0.6, duration: 0.15, ease: "power2.out" },
        0.30
      );

      // ── Phase 4: parchment unfurl (30–75%) — driven via scrollProgress ──
      // The WebGL scene reads scrollProgress directly.
      // The progress obj tracks the unfurl portion specifically.
      mainTl.to(
        progressObj,
        {
          value: 1,
          duration: 0.45,
          ease: "power2.out",
          onUpdate: () => {
            // progress is already handled by ScrollTrigger onUpdate
          },
        },
        0.30
      );

      // ── Phase 5: content reveal in bands ──
      // Bands appear as their section of the parchment is revealed.
      // The unfurl runs 0.30–0.75 so the top of the paper is exposed ~0.38.
      mainTl.to(
        contentBand1Ref.current,
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.10, ease: "power3.out" },
        0.40
      );
      mainTl.to(
        contentBand2Ref.current,
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.10, ease: "power3.out" },
        0.50
      );
      mainTl.to(
        contentBand3Ref.current,
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.10, ease: "power3.out" },
        0.60
      );
      mainTl.to(
        contentBand4Ref.current,
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.10, ease: "power3.out" },
        0.70
      );

      // ── Phase 6: vignette softens at settle (90–100%) ──
      mainTl.to(
        vignetteRef.current,
        { opacity: 0.3, duration: 0.1, ease: "power2.out" },
        0.90
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [isLoaded, handleProgress]);

  // Map global scroll progress (0–1) to unfurl progress (0.30–0.75 → 0–1)
  const unfurlProgress = Math.min(
    1,
    Math.max(0, (scrollProgress - 0.30) / 0.45)
  );

  return (
    <section
      ref={sectionRef}
      className="scroll-section relative flex min-h-[100svh] items-center justify-center overflow-hidden"
    >
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080604] via-[#0f0d0a] to-[#080604]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(180,140,80,0.06),transparent)]" />
        <div className="parchment-bg-texture absolute inset-0 opacity-[0.02]" />
        <div
          ref={vignetteRef}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_15%,rgba(0,0,0,0.85)_100%)]"
        />
      </div>

      {/* WebGL graphics layer */}
      {webglSupported && (
        <div className="absolute inset-0 z-10">
          <Suspense fallback={null}>
            <ParchmentScene
              progress={unfurlProgress}
              className="h-full w-full"
            />
          </Suspense>
        </div>
      )}

      {/* Depth haze — atmospheric glow behind the scroll */}
      <div
        ref={hazeRef}
        className="scene-depth-haze pointer-events-none absolute inset-0 z-[5] opacity-0"
      />

      {/* SVG decorative overlays: ropes + seal + debris */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        {/* Seal debris particles */}
        <div ref={debrisRef} className="absolute z-50 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute h-2 w-2 rounded-full opacity-0"
              style={{
                background: `radial-gradient(circle, ${
                  i % 2 === 0 ? "#dc2626" : "#991b1b"
                } 30%, ${i % 3 === 0 ? "#7f1d1d" : "#450a0a"} 100%)`,
                boxShadow: "0 0 4px rgba(220,38,38,0.4)",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        {/* Glow behind seal */}
        <div
          ref={glowRef}
          className="absolute w-[350px] h-[350px] rounded-full opacity-0"
          style={{
            background:
              "radial-gradient(circle, rgba(201,162,39,0.5) 0%, rgba(180,140,80,0.2) 30%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Ropes SVG */}
        <svg
          className="absolute z-30 pointer-events-none"
          width="160"
          height="200"
          viewBox="0 0 160 200"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id="ropeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B6914" />
              <stop offset="50%" stopColor="#CD9B1D" />
              <stop offset="100%" stopColor="#8B6914" />
            </linearGradient>
            <filter id="ropeShadow">
              <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>
          <path
            ref={leftRopeRef}
            d="M 80 0 Q 60 30, 50 70 Q 40 110, 45 150"
            stroke="url(#ropeGrad)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            filter="url(#ropeShadow)"
          />
          <path
            ref={rightRopeRef}
            d="M 80 0 Q 100 30, 110 70 Q 120 110, 115 150"
            stroke="url(#ropeGrad)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            filter="url(#ropeShadow)"
          />
        </svg>

        {/* Wax Seal */}
        <div ref={sealRef} className="absolute z-40">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20">
            <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-2xl">
              <defs>
                <radialGradient id="waxGrad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#dc2626" />
                  <stop offset="40%" stopColor="#991b1b" />
                  <stop offset="100%" stopColor="#450a0a" />
                </radialGradient>
                <filter id="waxGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d="M 50 8 Q 72 10, 88 28 Q 96 48, 92 65 Q 86 82, 68 90 Q 50 95, 32 90 Q 14 82, 8 65 Q 4 48, 12 28 Q 28 10, 50 8"
                fill="url(#waxGrad)"
                filter="url(#waxGlow)"
              />
              <ellipse cx="78" cy="72" rx="6" ry="9" fill="#7f1d1d" />
              <ellipse cx="22" cy="75" rx="5" ry="8" fill="#7f1d1d" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-red-400/30 bg-gradient-to-br from-red-600/90 to-red-900/90 shadow-inner sm:h-11 sm:w-11">
                <span className="font-serif text-sm font-semibold tracking-tight text-red-100/90 sm:text-base">
                  {partner1.charAt(0)}{partner2.charAt(0)}
                </span>
              </div>
            </div>
            <div className="absolute left-2.5 top-2.5 h-3 w-3 rounded-full bg-gradient-to-br from-red-300/60 to-transparent blur-[2px]" />
          </div>
        </div>
      </div>

      {/* CSS-only parchment fallback when WebGL unavailable */}
      {!webglSupported && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-sm"
            style={{
              width: "min(34rem, 92vw)",
              height: "78vh",
              background: "linear-gradient(180deg, #f5e6c8 0%, #ead8b0 30%, #e4d0a4 70%, #f0deba 100%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 0 60px rgba(139,90,43,0.15)",
            }}
          >
            <div className="parchment-texture absolute inset-0 opacity-30 rounded-sm" />
          </div>
        </div>
      )}

      {/* DOM Content layer — positioned over the WebGL parchment */}
      <div className="relative z-30 flex flex-col items-center justify-center">
        <div
          className="relative flex flex-col items-center justify-center px-8 py-16 text-center sm:px-12"
          style={{
            width: "min(32rem, 90vw)",
            minHeight: "70vh",
          }}
        >
          {/* Band 1: Tagline + Names */}
          <div ref={contentBand1Ref} className="content-band" style={{ opacity: 0 }}>
            <svg className="mb-8 h-8 w-56 text-amber-700/40" viewBox="0 0 200 30">
              <path d="M 10 15 Q 30 5, 50 15 T 90 15" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <circle cx="100" cy="15" r="4" fill="currentColor" />
              <path d="M 110 15 Q 130 25, 150 15 T 190 15" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M 0 15 L 10 15" stroke="currentColor" strokeWidth="1" />
              <path d="M 190 15 L 200 15" stroke="currentColor" strokeWidth="1" />
            </svg>

            <p className="mb-8 font-serif text-sm tracking-[0.4em] text-amber-700/80 uppercase sm:text-base lg:text-lg">
              {tagline}
            </p>

            <h1 className="scroll-text mb-3 font-serif text-4xl font-light tracking-wider text-amber-950 sm:text-5xl lg:text-6xl">
              {partner1}
            </h1>

            <div className="my-4 flex items-center gap-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-600/50" />
              <span className="font-serif text-3xl italic text-amber-600 sm:text-4xl">&amp;</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-600/50" />
            </div>

            <h1 className="scroll-text mb-10 font-serif text-4xl font-light tracking-wider text-amber-950 sm:text-5xl lg:text-6xl">
              {partner2}
            </h1>
          </div>

          {/* Band 2: Cities */}
          <div ref={contentBand2Ref} className="content-band" style={{ opacity: 0 }}>
            <div className="mb-10 flex items-center gap-4">
              <span className="rounded-sm border border-amber-600/20 bg-amber-50/50 px-4 py-1.5 font-serif text-xs tracking-[0.2em] text-amber-800 uppercase shadow-sm sm:text-sm">
                {city1}
              </span>
              <svg className="h-4 w-8 text-amber-600/60" viewBox="0 0 32 16">
                <path d="M 0 8 L 28 8 M 24 4 L 28 8 L 24 12" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              <span className="rounded-sm border border-amber-600/20 bg-amber-50/50 px-4 py-1.5 font-serif text-xs tracking-[0.2em] text-amber-800 uppercase shadow-sm sm:text-sm">
                {city2}
              </span>
            </div>
          </div>

          {/* Band 3: Date + Location */}
          <div ref={contentBand3Ref} className="content-band" style={{ opacity: 0 }}>
            <div className="relative mb-10 border-y border-amber-600/30 px-8 py-5">
              <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-l border-t border-amber-600/30 bg-amber-100" />
              <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 border-b border-r border-amber-600/30 bg-amber-100" />
              <p className="font-serif text-lg tracking-[0.12em] text-amber-900 sm:text-xl lg:text-2xl">
                {dateDisplay}
              </p>
            </div>

            {location && (
              <p className="mb-8 font-serif text-sm text-amber-700/70 sm:text-base">
                {[location.city, location.state, location.country].filter(Boolean).join(" · ")}
              </p>
            )}

            <p className="mb-10 max-w-sm font-serif text-sm leading-relaxed italic text-amber-800/60 sm:text-base">
              Request the honour of your presence at the celebration of their union
            </p>
          </div>

          {/* Band 4: Closing */}
          <div ref={contentBand4Ref} className="content-band" style={{ opacity: 0 }}>
            {closing && (
              <div className="space-y-4 text-center">
                {closing.message && (
                  <p className="max-w-xs font-serif text-xs text-amber-700/50 sm:text-sm lg:max-w-sm">
                    {closing.message}
                  </p>
                )}
                {closing.signoff && (
                  <p className="font-serif text-sm italic text-amber-700/70 sm:text-base">
                    {closing.signoff}
                  </p>
                )}
              </div>
            )}

            <svg className="mt-8 h-8 w-56 rotate-180 text-amber-700/40" viewBox="0 0 200 30">
              <path d="M 10 15 Q 30 5, 50 15 T 90 15" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <circle cx="100" cy="15" r="4" fill="currentColor" />
              <path d="M 110 15 Q 130 25, 150 15 T 190 15" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M 0 15 L 10 15" stroke="currentColor" strokeWidth="1" />
              <path d="M 190 15 L 200 15" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>

      {/* Scroll instruction indicator */}
      <div ref={scrollHintRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex flex-col items-center gap-3">
          <span className="font-serif text-xs tracking-[0.3em] text-amber-300/40 uppercase sm:text-sm">
            Scroll to unfurl
          </span>
          <div className="flex flex-col items-center gap-1 animate-bounce">
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
