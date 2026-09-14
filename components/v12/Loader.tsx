"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import Monogram from "@/components/v12/Monogram";

interface LoaderProps {
  partner1: string;
  partner2: string;
  hashtag?: string;
}

export default function Loader({ partner1, partner2, hashtag }: LoaderProps) {
  const [done, setDone] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    // Hold the page at the top and still until the monogram has come together.
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // ?loader=hold keeps the assembled monogram on screen for previewing it.
    const hold =
      new URLSearchParams(window.location.search).get("loader") === "hold";

    // If the tab is hidden or throttled the animation can't run, so never keep
    // the page hostage: hand over after a hard ceiling regardless.
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      html.style.overflow = previousOverflow;
      setDone(true);
    };
    const ceiling = window.setTimeout(finish, 6500);

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set("[data-part], [data-caption]", { opacity: 1 });
        gsap.timeline({ onComplete: finish }).to(overlay, {
          opacity: 0,
          duration: 0.5,
          delay: 0.8,
          ease: "power2.inOut",
        });
        return;
      }

      const drawn = gsap.utils.toArray<SVGPathElement>("[data-draw]");
      drawn.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });

      gsap.set("[data-leaf]", { scale: 0, transformOrigin: "50% 50%" });
      gsap.set("[data-part='k']", { xPercent: -30, opacity: 0 });
      gsap.set("[data-part='s']", { xPercent: 30, opacity: 0 });
      gsap.set("[data-part='dancer']", {
        opacity: 0,
        scale: 0.85,
        transformOrigin: "50% 60%",
      });
      gsap.set("[data-part='amp']", {
        opacity: 0,
        scale: 0,
        transformOrigin: "50% 50%",
      });
      gsap.set("[data-caption]", { opacity: 0, y: 12 });
      gsap.set("[data-part='summit']", { opacity: 0 });

      const timeline = gsap
        .timeline({
          defaults: { ease: "power3.out" },
          onComplete: hold ? undefined : finish,
        })
        // Laurels grow up each side
        .to(
          "[data-part='laurel-left'] [data-leaf]",
          { scale: 1, duration: 0.5, stagger: 0.045, ease: "back.out(2)" },
          0.1,
        )
        .to(
          "[data-part='laurel-right'] [data-leaf]",
          { scale: 1, duration: 0.5, stagger: 0.045, ease: "back.out(2)" },
          0.1,
        )
        // The initials slide in from either side and settle
        .to(
          "[data-part='k']",
          { xPercent: 0, opacity: 1, duration: 0.9, ease: "back.out(1.4)" },
          0.55,
        )
        .to(
          "[data-part='s']",
          { xPercent: 0, opacity: 1, duration: 0.9, ease: "back.out(1.4)" },
          0.55,
        )
        // Summit and ice axe draw themselves; the dancer steps into the S
        .to("[data-part='summit']", { opacity: 1, duration: 0.2 }, 1.15)
        .to(
          drawn,
          {
            strokeDashoffset: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: "power2.inOut",
          },
          1.15,
        )
        .to(
          "[data-part='dancer']",
          { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.6)" },
          1.25,
        )
        // The ampersand ties them together
        .to(
          "[data-part='amp']",
          { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(2.2)" },
          1.7,
        )
        .to(
          "[data-caption]",
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
          1.85,
        );

      if (hold) {
        window.clearTimeout(ceiling);
        (window as unknown as { __loader?: gsap.core.Timeline }).__loader =
          timeline;
        return;
      }
      // Hold, then hand over to the page
      timeline.to(
        overlay,
        { opacity: 0, scale: 1.04, duration: 0.7, ease: "power2.inOut" },
        3.1,
      );
    }, overlay);

    return () => {
      window.clearTimeout(ceiling);
      ctx.revert();
      html.style.overflow = previousOverflow;
    };
  }, []);

  if (done) return null;

  return (
    <div
      ref={overlayRef}
      className="journey-day fixed inset-0 z-[100] flex flex-col items-center justify-center bg-(--jm-bg)"
      role="status"
      aria-live="polite"
      aria-label={`Loading the wedding of ${partner1} and ${partner2}`}
    >
      <Monogram className="h-[min(70vw,58svh)] w-[min(70vw,58svh)]" />
      <p
        data-caption
        className="mt-2 font-serif text-2xl tracking-wide text-(--jm-ink) sm:text-3xl"
      >
        {partner1} <span className="font-script text-(--jm-accent)">&amp;</span>{" "}
        {partner2}
      </p>
      {hashtag && (
        <p
          data-caption
          className="mt-2 text-[0.65rem] tracking-[0.35em] text-(--jm-muted) uppercase sm:text-xs"
        >
          {hashtag}
        </p>
      )}
    </div>
  );
}
