"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface HeroProps {
  partner1: string;
  partner2: string;
  tagline: string;
  city1?: string;
  city2?: string;
}

export default function Hero({
  partner1,
  partner2,
  tagline,
  city1 = "Delhi",
  city2 = "Pune",
}: HeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ampersandRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) {
      gsap.set(
        [
          nameRef.current,
          taglineRef.current,
          ampersandRef.current,
          subtitleRef.current,
        ],
        { opacity: 1 }
      );
      return;
    }

    const tl = gsap.timeline({ delay: 0.3 });

    tl.fromTo(
      taglineRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    )
      .fromTo(
        nameRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.4, ease: "power3.out" },
        "-=0.6"
      )
      .fromTo(
        ampersandRef.current,
        { opacity: 0, scale: 0.5, rotation: -10 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.8,
          ease: "back.out(1.7)",
        },
        "-=0.8"
      )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
        "-=0.3"
      );

    const parallaxTween = gsap.to(containerRef.current, {
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      tl.kill();
      parallaxTween.scrollTrigger?.kill();
      parallaxTween.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-svh flex-col items-center justify-center px-6 text-center"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-ivory via-cream to-cream" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <p
          ref={taglineRef}
          className="font-sans text-lg tracking-[0.35em] text-warm-gray uppercase opacity-0 sm:text-xl"
        >
          {tagline}
        </p>

        <h1
          ref={nameRef}
          className="font-serif text-5xl leading-tight font-light tracking-wide text-charcoal opacity-0 sm:text-7xl lg:text-8xl"
        >
          {partner1}
          <span
            ref={ampersandRef}
            className="mx-3 inline-block font-serif text-gold italic opacity-0 sm:mx-5"
          >
            &amp;
          </span>
          {partner2}
        </h1>

        <div ref={subtitleRef} className="mt-4 flex items-center gap-3 opacity-0">
          <span className="block h-px w-12 bg-gold/50" />
          <span className="font-sans text-sm tracking-[0.4em] text-warm-gray-light uppercase">
            Request the pleasure of your company
          </span>
          <span className="block h-px w-12 bg-gold/50" />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="rounded-full bg-burgundy/20 px-3 py-1 font-sans text-xs tracking-[0.22em] text-charcoal uppercase">
            {city1}
          </span>
          <span className="font-sans text-xs tracking-[0.3em] text-gold-light uppercase">
            to
          </span>
          <span className="rounded-full bg-gold/20 px-3 py-1 font-sans text-xs tracking-[0.22em] text-charcoal uppercase">
            {city2}
          </span>
        </div>
      </div>

      <div className="absolute bottom-10 animate-bounce">
        <svg
          className="h-6 w-6 text-gold/60"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
          />
        </svg>
      </div>
    </section>
  );
}
