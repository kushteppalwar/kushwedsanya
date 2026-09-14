"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";

interface LoaderProps {
  partner1: string;
  partner2: string;
  hashtag?: string;
}

const SYMBOL = "/weddingSymbol.png";
const WIDTH = 860;
const HEIGHT = 718;

/**
 * Regions of the artwork, as clip-path polygons in % of the image. Together
 * they tile the whole picture, so once every piece lands the seams vanish.
 */
const pieces: { id: string; clip: string; from: gsap.TweenVars }[] = [
  {
    id: "laurel-left",
    clip: "polygon(0% 0%, 50% 0%, 50% 26.5%, 19.2% 26.5%, 19.2% 100%, 0% 100%)",
    from: {
      xPercent: -14,
      yPercent: 6,
      rotate: -8,
      opacity: 0,
      transformOrigin: "20% 90%",
    },
  },
  {
    id: "laurel-right",
    clip: "polygon(50% 0%, 100% 0%, 100% 100%, 82.8% 100%, 82.8% 72.4%, 86.6% 65.5%, 86.6% 39%, 81.4% 26.5%, 50% 26.5%)",
    from: {
      xPercent: 14,
      yPercent: 6,
      rotate: 8,
      opacity: 0,
      transformOrigin: "80% 90%",
    },
  },
  {
    id: "k",
    clip: "polygon(19.2% 26.5%, 58.1% 26.5%, 52.3% 41.8%, 48.3% 55.7%, 48.3% 66.2%, 51.2% 78%, 58.1% 89.1%, 58.1% 100%, 19.2% 100%)",
    from: { xPercent: -22, opacity: 0 },
  },
  {
    id: "s",
    clip: "polygon(58.1% 26.5%, 81.4% 26.5%, 86.6% 39%, 86.6% 65.5%, 82.8% 72.4%, 82.8% 100%, 58.1% 100%, 58.1% 89.1%, 51.2% 78%, 48.3% 66.2%, 55.6% 66.2%, 55.6% 56.4%, 48.3% 56.4%, 48.3% 55.7%, 52.3% 41.8%)",
    from: { xPercent: 22, opacity: 0 },
  },
  {
    id: "amp",
    clip: "polygon(48.3% 56.4%, 55.6% 56.4%, 55.6% 66.2%, 48.3% 66.2%)",
    from: { scale: 0, opacity: 0, transformOrigin: "52% 61%" },
  },
];

export default function Loader({ partner1, partner2, hashtag }: LoaderProps) {
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Hold the page at the top and still, and park every piece off-stage, before
  // anything paints.
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const ctx = gsap.context(() => {
      if (reduced) return;
      pieces.forEach((piece) =>
        gsap.set(`[data-piece='${piece.id}']`, piece.from),
      );
      gsap.set("[data-caption]", { opacity: 0, y: 12 });
    }, overlay);

    return () => {
      ctx.revert();
      html.style.overflow = previousOverflow;
    };
  }, []);

  // Start once the artwork has loaded, but never wait on it for long.
  useEffect(() => {
    const fallback = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(fallback);
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !ready) return;

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
      document.documentElement.style.overflow = "";
      setDone(true);
    };
    const ceiling = window.setTimeout(finish, 6500);

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap
          .timeline({ onComplete: finish })
          .to(overlay, {
            opacity: 0,
            duration: 0.5,
            delay: 0.9,
            ease: "power2.inOut",
          });
        return;
      }

      const timeline = gsap
        .timeline({
          defaults: { ease: "power3.out" },
          onComplete: hold ? undefined : finish,
        })
        // Laurels sweep in from either side
        .to(
          "[data-piece='laurel-left']",
          {
            xPercent: 0,
            yPercent: 0,
            rotate: 0,
            opacity: 1,
            duration: 1.1,
            ease: "power4.out",
          },
          0.1,
        )
        .to(
          "[data-piece='laurel-right']",
          {
            xPercent: 0,
            yPercent: 0,
            rotate: 0,
            opacity: 1,
            duration: 1.1,
            ease: "power4.out",
          },
          0.1,
        )
        // The initials slide in and settle into place
        .to(
          "[data-piece='k']",
          { xPercent: 0, opacity: 1, duration: 1, ease: "back.out(1.2)" },
          0.6,
        )
        .to(
          "[data-piece='s']",
          { xPercent: 0, opacity: 1, duration: 1, ease: "back.out(1.2)" },
          0.6,
        )
        // The ampersand ties them together
        .to(
          "[data-piece='amp']",
          { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2.2)" },
          1.45,
        )
        .to(
          "[data-caption]",
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 },
          1.7,
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
        3.0,
      );
    }, overlay);

    return () => {
      window.clearTimeout(ceiling);
      ctx.revert();
    };
  }, [ready]);

  if (done) return null;

  return (
    <div
      ref={overlayRef}
      className="journey-day fixed inset-0 z-[100] flex flex-col items-center justify-center bg-(--jm-bg)"
      role="status"
      aria-live="polite"
      aria-label={`Loading the wedding of ${partner1} and ${partner2}`}
    >
      <div
        className="relative"
        style={{
          width: `min(82vw, 62svh * ${WIDTH / HEIGHT})`,
          aspectRatio: `${WIDTH} / ${HEIGHT}`,
        }}
      >
        {pieces.map((piece, index) => (
          <div
            key={piece.id}
            data-piece={piece.id}
            className="absolute inset-0 mix-blend-multiply will-change-transform"
            style={{ clipPath: piece.clip }}
          >
            <Image
              src={SYMBOL}
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 82vw, 60vh"
              className="object-contain"
              onLoad={index === 0 ? () => setReady(true) : undefined}
            />
          </div>
        ))}
      </div>

      <p
        data-caption
        className="mt-4 font-serif text-2xl tracking-wide text-(--jm-ink) sm:text-3xl"
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
