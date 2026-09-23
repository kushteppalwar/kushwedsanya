"use client";

import { useEffect, useState } from "react";
import { LeafDivider } from "@/components/v2/Ornaments";
import SceneShell from "@/components/v14/SceneShell";

interface WelcomeSceneProps {
  partner1: string;
  partner2: string;
  intro?: string;
  request?: string;
}

/** Title-cases a raw query value, so "?guest=the-sharma-family" reads naturally. */
function formatGuest(raw: string) {
  return decodeURIComponent(raw)
    .replace(/[-_+]/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * The first scene past the gate: a personal "Dear {guest}" when the link
 * carries a `?guest=` name — sent as `.../version14?guest=The+Sharma+Family` —
 * and the invitation itself either way.
 */
export default function WelcomeScene({ partner1, partner2, intro, request }: WelcomeSceneProps) {
  const [guest, setGuest] = useState<string | null>(null);

  useEffect(() => {
    // Starts empty so the server and the first client paint agree; fills in
    // just after mount, once the URL is available.
    const read = () => {
      const raw = new URLSearchParams(window.location.search).get("guest");
      if (raw) setGuest(formatGuest(raw));
    };
    read();
  }, []);

  return (
    <SceneShell tone="ivory">
      {guest && (
        <p className="font-script text-3xl text-rani sm:text-4xl">Dear {guest},</p>
      )}
      <p className={`text-[0.7rem] tracking-[0.38em] text-cocoa-soft uppercase sm:text-xs ${guest ? "mt-6" : ""}`}>
        {intro ?? "You are cordially invited to the wedding of"}
      </p>
      <h1 className="mt-4 font-script text-[clamp(3.2rem,11vw,5.6rem)] leading-[1.05] text-rani">
        {partner1}
        <span className="mx-3 text-[0.6em] text-turmeric sm:mx-5">&amp;</span>
        {partner2}
      </h1>
      {request && (
        <p className="mx-auto mt-5 max-w-md font-sans text-lg leading-relaxed text-cocoa-soft italic sm:text-xl">
          {request}
        </p>
      )}
      <LeafDivider className="mx-auto mt-8 h-6 w-56 text-turmeric" />
      <p
        className="mt-8 animate-bounce text-[0.65rem] tracking-[0.4em] text-cocoa-soft/70 uppercase motion-reduce:animate-none"
        aria-hidden="true"
      >
        Scroll
      </p>
    </SceneShell>
  );
}
