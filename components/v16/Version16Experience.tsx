"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { ExplorerRoute, ExplorerStage } from "@/components/v4-2/stages";
import type { Atlas3DPin, Atlas3DPlace, MapPoint } from "@/components/v4-1/atlas";
import type { MapPalette } from "@/components/v4-1/mapScene";
import type { JourneyStop, MapPlace } from "@/lib/content";
import weddingConfig from "@/config/wedding.json";
import styles from "./version16.module.css";

type EventId = "mandap-puja" | "sakharpuda" | "sangeet" | "haldi" | "shadi" | "reception";

export type Version16Invitation = {
  familyOrder: "groom" | "bride";
  eventIds: EventId[];
};

type Celebration = {
  id: EventId;
  title: string;
  imageSrc: string;
  videoSrc: string;
  date: string;
  time: string;
  hall?: string;
  hallType?: "Hall" | "Area";
  venue: string;
  city: "Pune" | "New Delhi";
  dressCode: string[];
  lunch?: string;
  mapUrl: string;
};

const invitationMapPalette: MapPalette = {
  sky: "#f7f0e5",
  hemisphereSky: "#fff9ef",
  hemisphereGround: "#f1e7d6",
  sun: "#fff5dc",
  terrainLow: "#cbb887",
  terrainHigh: "#a58c5c",
  gridCell: "#e3d5b9",
  gridSection: "#c8b284",
  ink: "#654449",
  accent: "#873b43",
  travellerAccent: "#b48a3c",
  cloud: "#fffaf2",
  fogNear: 2.6,
  fogFar: 7,
  pinLight: 0,
  pinEmissive: 0.3,
  vehicleBody: "#573e2b",
  vehicleAccent: "#a7484f",
  vehicleDark: "#6f4f46",
};

const guestOrigins: MapPlace[] = weddingConfig.journey?.guestOrigins ?? [];

const allCelebrations: Celebration[] = [
  {
    id: "mandap-puja",
    title: "Mandap Puja",
    imageSrc: "/v15-2/mandap-puja-poster.jpg",
    videoSrc: "/v15-2/mandap.mp4",
    date: "Sunday, 22 November 2026",
    time: "10:00 am",
    venue: "Pristine Royale",
    city: "Pune",
    dressCode: [],
    lunch: "Lunch at 1:00 pm",
    mapUrl: "https://maps.app.goo.gl/dRNXLzzNU8i4fCqg8",
  },
  {
    id: "sakharpuda",
    title: "Seemant Poojan & Mehendi",
    imageSrc: "/v15-2/sakharpuda-poster.jpg",
    videoSrc: "/v15-2/sakharpuda.mp4",
    date: "Monday, 23 November 2026",
    time: "1:30 pm",
    hall: "Pacific 2",
    hallType: "Hall",
    venue: "The Ocean Pearl Gardenia",
    city: "New Delhi",
    dressCode: ["Traditional Indian attire"],
    mapUrl: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
  },
  {
    id: "sangeet",
    title: "Tilak & Sangeet",
    imageSrc: "/v15-2/sangeet-poster.jpg",
    videoSrc: "/v15-2/sangeet.mp4",
    date: "Monday, 23 November 2026",
    time: "7:30",
    hall: "Pacific 2",
    hallType: "Hall",
    venue: "The Ocean Pearl Gardenia",
    city: "New Delhi",
    dressCode: ["Indo-Western"],
    mapUrl: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
  },
  {
    id: "haldi",
    title: "Haldi",
    imageSrc: "/v15-2/haldi-poster.jpg",
    videoSrc: "/v15-2/haldi.mp4",
    date: "Tuesday, 24 November 2026",
    time: "10:00 am",
    hall: "Pool Side",
    hallType: "Area",
    venue: "The Ocean Pearl Gardenia",
    city: "New Delhi",
    dressCode: ["Shades of yellow"],
    mapUrl: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
  },
  {
    id: "shadi",
    title: "Shaadi",
    imageSrc: "/v15-2/shadi-poster.jpg",
    videoSrc: "/v15-2/shadi.mp4",
    date: "Tuesday, 24 November 2026",
    time: "7:30 pm",
    hall: "Pacific 1",
    hallType: "Hall",
    venue: "The Ocean Pearl Gardenia",
    city: "New Delhi",
    dressCode: ["Traditional attire"],
    mapUrl: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
  },
  {
    id: "reception",
    title: "Reception",
    imageSrc: "/v15-2/reception-poster.jpg",
    videoSrc: "/v15-2/reception.mp4",
    date: "Saturday, 28 November 2026",
    time: "7:30 pm",
    venue: "Swastik Banquet Lawns (Mayfield)",
    city: "Pune",
    dressCode: ["Western attire"],
    mapUrl: "https://maps.app.goo.gl/iHYujWGfTm6Bc9KN9",
  },
];

const ExplorerScene = dynamic(() => import("@/components/v4-2/ExplorerScene"), {
  ssr: false,
  loading: () => <MapFallback />,
});

function MapFallback() {
  return (
    <svg className={styles.mapFallback} viewBox="0 0 360 250" role="img" aria-label="A route connecting Pune and Delhi">
      <defs>
        <linearGradient id="indiaPaper" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#eee1c9" />
          <stop offset="1" stopColor="#dfc99f" />
        </linearGradient>
      </defs>
      <path d="M0 0h360v250H0z" fill="url(#indiaPaper)" />
      <path d="M84 48 126 32l34 10 24 25 40 6 26 37-9 28-25 18-9 36-34 17-17-21-30-1-8-29-31-17 4-34-22-20z" fill="#bda977" opacity=".48" />
      <path d="M103 168 Q175 40 260 83" fill="none" stroke="#a34d48" strokeWidth="2" strokeDasharray="5 6" />
      <circle cx="103" cy="168" r="7" fill="#702b37" stroke="#f7f0e5" strokeWidth="3" />
      <circle cx="260" cy="83" r="7" fill="#702b37" stroke="#f7f0e5" strokeWidth="3" />
      <text x="86" y="194">PUNE</text>
      <text x="238" y="65">DELHI</text>
      <path d="m179 98 13-4-4 13-3-5-6-4z" fill="#a34d48" />
    </svg>
  );
}

function MapJourney({ direction }: { direction: "north" | "home" }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const northbound = direction === "north";
  const pune: JourneyStop = { person: "Kush", city: "Pune", state: "Maharashtra", lat: 18.5204, lon: 73.8567 };
  const delhi: JourneyStop = { person: "Sanya", city: "New Delhi", state: "Delhi", lat: 28.6139, lon: 77.209 };
  const from = northbound ? pune : delhi;
  const to = northbound ? delhi : pune;
  const point = (place: JourneyStop): MapPoint => ({ x: place.lon - to.lon, z: to.lat - place.lat });
  const a = point(from);
  const b = point(to);
  const middle = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
  const arrivalPoint = (place: MapPlace): MapPoint => ({ x: place.lon - to.lon, z: to.lat - place.lat });
  const indiaGuests = guestOrigins.filter((place) => place.lat >= 6 && place.lat <= 38 && place.lon >= 68 && place.lon <= 98);
  const worldGuests = guestOrigins.filter((place) => !indiaGuests.includes(place));
  const routes: ExplorerRoute[] = [
    {
      id: "trip",
      from: a,
      to: b,
      bow: northbound ? 0.2 : -0.2,
      head: "vehicle",
      vehicleKind: "plane",
      trip: 3.4,
    },
    ...(northbound
      ? [
          ...indiaGuests.map((place, index) => ({
            id: `india-${place.city}`,
            from: arrivalPoint(place),
            to: b,
            bow: index % 2 === 0 ? 0.18 : -0.18,
            width: 1.5,
            ghost: 0.1,
            head: "vehicle" as const,
            vehicleKind: "plane" as const,
            trip: 5.5,
          })),
          ...worldGuests.map((place, index) => {
            const origin = arrivalPoint(place);
            const realDistance = Math.hypot(origin.x - b.x, origin.z - b.z);
            return {
              id: `world-${place.city}`,
              from: origin,
              to: b,
              bow: index % 2 === 0 ? 0.1 : -0.1,
              width: 1.4,
              head: "vehicle" as const,
              vehicleKind: "plane" as const,
              trip: 7,
              approach: true,
              // Fly in across most of the real distance rather than a fixed
              // hop, so a guest from Switzerland travels visibly less far
              // than one from Canada — and either is far enough to actually
              // read as "coming from there" against this stage's wide, pulled-
              // back camera (see the "everyone" stage below).
              approachRange: Math.min(realDistance * 0.88, 200),
              label: place.city,
            };
          }),
        ]
      : []),
  ];
  const allOrigins = [a, b, ...guestOrigins.map(arrivalPoint)];
  const everyoneLook = {
    x: (Math.min(...allOrigins.map((place) => place.x)) + Math.max(...allOrigins.map((place) => place.x))) / 2,
    z: (Math.min(...allOrigins.map((place) => place.z)) + Math.max(...allOrigins.map((place) => place.z))) / 2,
  };
  // The India leg gets its own tighter camera — pulling all the way out to
  // the world fit in one step made the India routes (short hops next to a
  // whole-planet view) finish almost too fast to read, so the domestic and
  // international arrivals now read as two distinct beats instead of one.
  const indiaOrigins = [a, b, ...indiaGuests.map(arrivalPoint)];
  const indiaLook = {
    x: (Math.min(...indiaOrigins.map((place) => place.x)) + Math.max(...indiaOrigins.map((place) => place.x))) / 2,
    z: (Math.min(...indiaOrigins.map((place) => place.z)) + Math.max(...indiaOrigins.map((place) => place.z))) / 2,
  };
  const indiaRoutes = ["trip", "india-*"];
  const arrivalRoutes = ["trip", "india-*", "world-*"];
  const stages: ExplorerStage[] = northbound
    ? [
        {
          key: "origin",
          short: "Pune sets out",
          camera: { look: middle, fit: 26, portraitFit: 31, pitch: 48 },
          drawn: [],
        },
        {
          key: "flight",
          short: "Pune to Delhi",
          camera: { look: middle, fit: 26, portraitFit: 31, pitch: 48 },
          drawn: ["trip"],
          looping: ["trip"],
        },
        {
          key: "india",
          short: "Across India",
          camera: { look: indiaLook, fit: 42, portraitFit: 50, pitch: 50 },
          drawn: indiaRoutes,
          looping: indiaRoutes,
          flight: 2.2,
        },
        {
          key: "world",
          short: "From around the world",
          camera: { look: everyoneLook, fit: 245, portraitFit: 350, pitch: 50 },
          drawn: arrivalRoutes,
          looping: arrivalRoutes,
          flight: 2.2,
        },
        {
          key: "arrival",
          short: "Arrive in Delhi",
          camera: { look: b, fit: 20, portraitFit: 23, pitch: 48 },
          // Keep the India routes in view for the Delhi arrival; the overseas
          // routes were shown on the world stage just before this close-up.
          drawn: ["trip", "india-*"],
          looping: indiaRoutes,
          flight: 2.2,
        },
      ]
    : [
        {
          key: "origin",
          short: "Leaving Delhi",
          camera: { look: middle, fit: 26, portraitFit: 31, pitch: 48 },
          drawn: [],
        },
        {
          key: "flight",
          short: "Delhi to Pune",
          camera: { look: middle, fit: 26, portraitFit: 31, pitch: 48 },
          drawn: ["trip"],
          looping: ["trip"],
        },
        {
          key: "arrival-home",
          short: "Back in Pune",
          camera: { look: b, fit: 20, portraitFit: 23, pitch: 48 },
          drawn: ["trip"],
          parked: ["trip"],
          flight: 2.2,
        },
      ];
  const pins: Atlas3DPin[] = [
    { point: point(pune), stop: pune, align: northbound ? "end" : "start", color: "#873b43", compactLabel: true, hideBeyond: 110 },
    { point: point(delhi), stop: delhi, align: northbound ? "start" : "end", color: "#873b43", compactLabel: true, hideBeyond: 110 },
  ];
  // Every origin gets its name on the map now that India has its own
  // close-in stage to show them in — hideBeyond keeps the India labels off
  // the pulled-back world shot, where they'd just crowd the view.
  const places: Atlas3DPlace[] = northbound
    ? guestOrigins.map((place) => ({
        point: arrivalPoint(place),
        label: place.city,
        showLabel: true,
        compactLabel: true,
        labelAlign: place.lon > 100 ? "end" : "start",
        hideBeyond: indiaGuests.includes(place) ? 105 : undefined,
      }))
    : [];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "12% 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      const settleImmediately = () => setStageIndex(stages.length - 1);
      settleImmediately();
      return;
    }
    const resetToStart = () => setStageIndex(0);
    resetToStart();
    const start = window.setTimeout(() => setStageIndex(1), 400);
    const next = window.setTimeout(() => setStageIndex(2), 3200);
    const world = northbound ? window.setTimeout(() => setStageIndex(3), 8200) : undefined;
    const settle = northbound ? window.setTimeout(() => setStageIndex(4), 13200) : undefined;
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(next);
      if (world) window.clearTimeout(world);
      if (settle) window.clearTimeout(settle);
    };
  }, [active, northbound, stages.length]);

  const fallback = <MapFallback />;
  const chapterText = !northbound
    ? "After Delhi, the celebrations return to Pune."
    : stageIndex === 1
      ? "Kush's journey from Pune to Delhi begins the celebrations."
      : stageIndex === 2
        ? "From cities across India, everyone is making their way to Delhi."
        : stageIndex === 3
          ? "And from oceans away, family and friends are crossing continents to be there."
          : "Every journey comes together in Delhi for Kush and Sanya.";
  const chapterLabel = !northbound
    ? "The way home"
    : stageIndex === 1
      ? "Pune to Delhi"
      : stageIndex === 2
        ? "Across India"
        : stageIndex === 3
          ? "From around the world"
          : "Together in Delhi";
  return (
    <section ref={sectionRef} className={styles.journeyChapter} aria-label={northbound ? "Journey from Pune to Delhi" : "Journey from Delhi to Pune"}>
      <div className={styles.journeyFrame}>
        <div className={styles.mapViewport} role="img" aria-label={`A three-dimensional map showing travel from ${from.city} to ${to.city}`}>
          <ExplorerScene
            stages={stages}
            stageIndex={stageIndex}
            kind="plane"
            routes={routes}
            pins={pins}
            places={places}
            focus={{ portrait: { x: 0.5, y: 0.48 }, landscape: { x: 0.5, y: 0.5 } }}
            centre={middle}
            gridOrigin={{ x: -to.lon, z: to.lat }}
            active={active}
            fallback={fallback}
            palette={invitationMapPalette}
            landColor="#cbb887"
            oceanColor="#f7f0e5"
            coastlineColor="#654449"
          />
          <div className={styles.mapEdge} aria-hidden="true" />
        </div>
        <div className={styles.journeyCaption}>
          <span className={styles.chapterKicker}>{chapterLabel}</span>
          <p>{chapterText}</p>
          <span className={styles.cityRoute}>{from.city}<span aria-hidden="true"> → </span>{to.city}</span>
        </div>
      </div>
    </section>
  );
}

function EventScene({ event, familyOrder, progress }: { event: Celebration; familyOrder: "groom" | "bride"; progress?: string }) {
  const wrapperRef = useRef<HTMLElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const eventTitle = event.id === "sakharpuda" && familyOrder === "bride" ? "Seemant Poojan" : event.title;

  useEffect(() => {
    const scene = wrapperRef.current;
    const video = scene?.querySelector("video");
    if (!scene || !video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        video.preload = "auto";
        void video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    }, { threshold: 0.28 });
    observer.observe(scene);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  // The card and handoff icon settle into place the first time the scene
  // scrolls into view — once only, so revisiting it on the way back up
  // doesn't replay the fade.
  useEffect(() => {
    const scene = wrapperRef.current;
    if (!scene) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const revealImmediately = () => setVisible(true);
      revealImmediately();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { threshold: 0.18, rootMargin: "0px 0px -7% 0px" });
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={wrapperRef}
      className={`${styles.eventScene} ${visible ? styles.eventVisible : ""}`}
      id={event.id}
      aria-labelledby={`${event.id}-title`}
    >
      <div className={styles.eventArtwork}>
        <img className={styles.eventPoster} src={event.imageSrc} alt={`Illustration for ${eventTitle}`} loading="lazy" decoding="async" />
        <video
          className={`${styles.eventVideo} ${videoReady ? styles.videoReady : ""}`}
          muted
          playsInline
          preload="none"
          poster={event.imageSrc}
          aria-hidden="true"
          onLoadedData={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
        >
          <source src={event.videoSrc} type="video/mp4" />
        </video>
        <div className={styles.artworkShade} aria-hidden="true" />
      </div>
      {progress && <span className={styles.delhiProgress}>{progress}</span>}
      <span className={styles.artworkLocation}>{event.city}</span>
      <div className={styles.eventFrame}>
        <article className={styles.eventCard}>
          <span className={styles.cardFlourish} aria-hidden="true">✦</span>
          <h2 id={`${event.id}-title`}>{eventTitle}</h2>
          <div className={styles.cardDivider} aria-hidden="true" />
          <a className={styles.calendarLink} href={`/api/calendar/${event.id}?side=${familyOrder}`} aria-label={`Add ${eventTitle} to your calendar`}>
            <span>{event.date}</span>
            <strong>{event.time}</strong>
          </a>
          {event.lunch && <p className={styles.mealLine}>{event.lunch}</p>}
          <p className={styles.eventRoom}>
            {event.hall && <span>{event.hallType} · {event.hall}<br /></span>}
            <a
              className={styles.mapLink}
              href={event.mapUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${event.venue} in maps`}
            >
              <LocationIcon />
              <span>{event.venue}</span>
            </a>
          </p>
        </article>
        {event.dressCode.length > 0 && (
          <div className={styles.dressPlate}>
            <span className={styles.dressLabel}>Dress code</span>
            <p className={styles.dressCode}>{event.dressCode.join(" · ")}</p>
          </div>
        )}
      </div>
      <div className={styles.handoff} aria-hidden="true"><span>✥</span></div>
    </section>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M10 18s6-5.35 6-10.05a6 6 0 1 0-12 0C4 12.65 10 18 10 18Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="10" cy="7.8" r="2.05" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="m13.25 13.05 3.45-3.45m-2.55.05h2.5v2.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RSVP({ familyOrder }: { familyOrder: "groom" | "bride" }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.get("fullName"),
          phone: values.get("phone"),
          attending: values.get("attending"),
          partySize: values.get("partySize"),
          wishes: values.get("wishes"),
          website: values.get("website"),
        }),
      });
      if (!response.ok) throw new Error("RSVP could not be saved");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className={styles.rsvpSection} id="rsvp" aria-labelledby="rsvp-title">
      <div className={styles.rsvpFrame}>
        <div className={styles.rsvpPanel}>
          <span className={styles.chapterKicker}>We would love to celebrate with you</span>
          <h2 id="rsvp-title">Kindly RSVP</h2>
          <p>Please let us know if you can join us.</p>
          <form className={styles.rsvpForm} onSubmit={submit}>
            <label><span>Your name</span><input name="fullName" autoComplete="name" required maxLength={120} placeholder="Full name" /></label>
            <label><span>Phone number</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={32} placeholder="Your phone number" /></label>
            <label><span>Will you be joining us?</span><select name="attending" required defaultValue=""><option value="" disabled>Select one</option><option value="yes">Joyfully accepts</option><option value="no">Regretfully declines</option></select></label>
            <label><span>Number of guests attending, including you</span><input name="partySize" type="number" min="1" max="20" required placeholder="Number of guests" /></label>
            <label><span>Wishes for the couple <em>(optional)</em></span><textarea name="wishes" rows={3} maxLength={1200} placeholder="Share a wish for Kush & Sanya" /></label>
            <label className={styles.trapField} aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send your RSVP"}<span aria-hidden="true">✧</span></button>
            <span className={styles.privacyNote}>Your RSVP is shared with the hosts for planning.</span>
            {status === "sent" && <span className={styles.success} role="status">Thank you. Your RSVP has been received.</span>}
            {status === "error" && <span className={styles.error} role="alert">We couldn’t save your RSVP just yet. Please try again shortly.</span>}
          </form>
          <a className={styles.returnLink} href="#top">Return to the invitation ↑</a>
        </div>
      </div>
    </section>
  );
}

export default function Version16Experience({ invitation }: { invitation: Version16Invitation }) {
  const selected = useMemo(() => {
    const allowed = new Set(invitation.eventIds);
    return allCelebrations.filter((event) => allowed.has(event.id));
  }, [invitation.eventIds]);
  const firstDelhi = selected.findIndex((event) => event.city === "New Delhi");
  const hasDelhiEvents = firstDelhi !== -1;
  const hasReception = selected.some((event) => event.id === "reception");
  const openingNames = invitation.familyOrder === "bride" ? "Sanya & Kush" : "Kush & Sanya";
  const familyNames = invitation.familyOrder === "bride" ? "The Gupta and Teppalwar families" : "The Teppalwar and Gupta families";
  const delhiEvents = selected.filter((event) => event.city === "New Delhi");
  const firstEventId = selected[0]?.id ?? "rsvp";
  let delhiCount = 0;
  const flow: ReactNode[] = [];
  let outboundInserted = false;
  let returnInserted = false;

  selected.forEach((event) => {
    if (event.city === "New Delhi" && !outboundInserted) {
      flow.push(<MapJourney key="journey-pune-delhi" direction="north" />);
      outboundInserted = true;
    }
    if (event.id === "reception" && !returnInserted && hasDelhiEvents) {
      flow.push(<div className={styles.returnChapter} key="return-heading"><span className={styles.chapterKicker}>The final leg</span><h2>And back to Pune</h2><p>One last journey, together.</p></div>);
      flow.push(<MapJourney key="journey-delhi-pune" direction="home" />);
      returnInserted = true;
    }
    const progress = event.city === "New Delhi" ? `${++delhiCount} of ${delhiEvents.length}` : undefined;
    flow.push(<EventScene key={event.id} event={event} familyOrder={invitation.familyOrder} progress={progress} />);
  });

  return (
    <main className={styles.page}>
      <section className={styles.cover} id="top" aria-labelledby="cover-title">
        <img className={styles.coverPoster} src="/v15-2/entry-poster.jpg" alt="A hand-painted palace entrance welcoming guests to Kush and Sanya’s wedding" fetchPriority="high" />
        <div className={styles.coverWash} aria-hidden="true" />
        <div className={styles.coverFrame}>
          <span className={styles.coverKicker}>A celebration across cities</span>
          <p className={styles.coverFamilies}>{familyNames} joyfully invite you to celebrate the auspicious union of</p>
          <h1 id="cover-title">{openingNames}</h1>
          <span className={styles.coverDates}>22–28 November 2026</span>
          <a className={styles.beginButton} href={`#${firstEventId}`}>Begin the journey <span aria-hidden="true">↓</span></a>
        </div>
        <span className={styles.coverOrnament} aria-hidden="true">✥</span>
      </section>

      {flow}
      {hasReception && !hasDelhiEvents && <p className={styles.returnChapter}><span className={styles.chapterKicker}>Pune</span></p>}
      <RSVP familyOrder={invitation.familyOrder} />
      <footer className={styles.footer}>With love, Kush &amp; Sanya <span aria-hidden="true">✦</span></footer>
    </main>
  );
}
