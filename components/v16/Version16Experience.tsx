"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
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
  inviteCode?: string;
  familyInvite?: boolean;
  navigationEnabled?: boolean;
  backgroundMusic?: boolean;
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

const START_WEDDING_MUSIC_EVENT = "wedding:start-background-music";

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
  paperTexture: true,
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

function scrollToNextInvitePage(source: HTMLElement) {
  const currentPage = source.closest<HTMLElement>("[data-invitation-page]");
  if (!currentPage) return;
  const pages = Array.from(document.querySelectorAll<HTMLElement>("[data-invitation-page]"));
  const nextPage = pages[pages.indexOf(currentPage) + 1];
  if (!nextPage) return;
  const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  nextPage.scrollIntoView({ behavior, block: "start" });
}

function NextPageButton({ className, label = "Go to the next page" }: { className: string; label?: string }) {
  return (
    <button
      className={className}
      type="button"
      onClick={(event) => scrollToNextInvitePage(event.currentTarget)}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 4v15m-6-6 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

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

function MapJourney({ direction, familyInvite = false, navigationEnabled = false }: { direction: "north" | "home"; familyInvite?: boolean; navigationEnabled?: boolean }) {
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
  const indiaArcBows = [0.34, -0.42, 0.5, -0.58];
  const worldGuests = guestOrigins.filter((place) => !indiaGuests.includes(place));
  const worldArcBows = [0.12, -0.2, 0.28, -0.36];
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
            bow: indiaArcBows[index % indiaArcBows.length],
            width: 1,
            ghost: 0.1,
            head: "vehicle" as const,
            vehicleKind: "plane" as const,
            trip: familyInvite ? 4.2 : 5.5,
          })),
          ...worldGuests.map((place, index) => {
            const origin = arrivalPoint(place);
            const realDistance = Math.hypot(origin.x - b.x, origin.z - b.z);
            return {
              id: `world-${place.city}`,
              from: origin,
              to: b,
              bow: worldArcBows[index % worldArcBows.length],
              width: 1.4,
              head: "vehicle" as const,
              vehicleKind: "plane" as const,
              trip: familyInvite ? 5.2 : 7,
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
  // The close-up "Together in Delhi" beat keeps the original, tighter route
  // curves. The wider, separated arcs are only for the Across India overview.
  const indiaArrivalRoutes: ExplorerRoute[] = indiaGuests.map((place, index) => ({
    id: `arrival-india-${place.city}`,
    from: arrivalPoint(place),
    to: b,
    bow: index % 2 === 0 ? 0.18 : -0.18,
    width: 1.5,
    ghost: 0.1,
    head: "vehicle",
    vehicleKind: "plane",
    trip: 5.5,
  }));
  routes.push(...indiaArrivalRoutes);
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
  const familyIndiaOrigins = [b, ...indiaGuests.map(arrivalPoint)];
  const familyIndiaLook = {
    x: (Math.min(...familyIndiaOrigins.map((place) => place.x)) + Math.max(...familyIndiaOrigins.map((place) => place.x))) / 2,
    z: (Math.min(...familyIndiaOrigins.map((place) => place.z)) + Math.max(...familyIndiaOrigins.map((place) => place.z))) / 2,
  };
  const indiaRoutes = ["trip", "india-*"];
  const worldRoutes = ["world-*"];
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
          camera: { look: indiaLook, portraitLook: familyInvite ? familyIndiaLook : undefined, fit: 42, portraitFit: 50, pitch: 50 },
          drawn: familyInvite ? ["india-*"] : indiaRoutes,
          looping: familyInvite ? ["india-*"] : indiaRoutes,
          ...(familyInvite ? { hiddenPins: ["Pune"] } : {}),
          flight: familyInvite ? 1.6 : 2.2,
        },
        {
          key: "world",
          short: "From around the world",
          camera: { look: everyoneLook, fit: 245, portraitFit: 350, pitch: 50 },
          drawn: worldRoutes,
          looping: worldRoutes,
          flight: familyInvite ? 1.6 : 2.2,
        },
        {
          key: "arrival",
          short: "Arrive in Delhi",
          camera: { look: b, fit: 20, portraitFit: 23, pitch: 48 },
          // Keep the India routes in view for the Delhi arrival; the overseas
          // routes were shown on the world stage just before this close-up.
          drawn: ["trip", "arrival-india-*"],
          looping: ["trip", "arrival-india-*"],
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
          ...(familyInvite ? { looping: ["trip"] } : { parked: ["trip"] }),
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
    const familyNorthbound = familyInvite && northbound;
    const next = window.setTimeout(() => setStageIndex(2), familyNorthbound ? 5500 : 3200);
    const world = northbound ? window.setTimeout(() => setStageIndex(3), familyNorthbound ? 12000 : 8200) : undefined;
    const settle = northbound ? window.setTimeout(() => setStageIndex(4), familyNorthbound ? 19500 : 13200) : undefined;
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(next);
      if (world) window.clearTimeout(world);
      if (settle) window.clearTimeout(settle);
    };
  }, [active, familyInvite, northbound, stages.length]);

  const fallback = <MapFallback />;
  const chapterText = !northbound
    ? "The celebrations continue in Pune."
    : stageIndex === 1
      ? "Kush's journey from Pune to Delhi begins the celebrations."
      : stageIndex === 2
        ? "From cities across India, everyone is making their way to Delhi."
        : stageIndex === 3
          ? "And from oceans away, family and friends are crossing continents to be there."
          : familyInvite
            ? "Where every journey comes together."
            : "Every journey comes together in Delhi for Kush and Sanya.";
  const chapterLabel = !northbound
    ? "The final leg"
    : stageIndex === 1
      ? "Pune to Delhi"
      : stageIndex === 2
        ? "Across India"
        : stageIndex === 3
          ? "From around the world"
          : "Together in Delhi";
  return (
    <section
      ref={sectionRef}
      className={`${styles.journeyChapter} ${familyInvite ? styles.journeyChapterFamily : ""}`}
      id={northbound ? "journey-pune-delhi" : "journey-delhi-pune"}
      data-invitation-page=""
      aria-label={northbound ? "Journey from Pune to Delhi" : "Journey from Delhi to Pune"}
    >
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
          {!familyInvite && <small className={styles.mapAttribution}>Elevation: Mapzen Terrain Tiles · State boundaries: geoBoundaries / DataMeet</small>}
          <div className={styles.mapEdge} aria-hidden="true" />
        </div>
        <div className={styles.journeyCaption}>
          <span className={styles.chapterKicker}>{chapterLabel}</span>
          <p>{chapterText}</p>
          <span className={styles.cityRoute}>{from.city}<span aria-hidden="true"> → </span>{to.city}</span>
        </div>
      </div>
      {navigationEnabled && <NextPageButton className={styles.journeyArrow} label="Continue to the next page" />}
    </section>
  );
}

function EventScene({ event, familyOrder, familyInvite = false, navigationEnabled = false, progress }: { event: Celebration; familyOrder: "groom" | "bride"; familyInvite?: boolean; navigationEnabled?: boolean; progress?: string }) {
  const wrapperRef = useRef<HTMLElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const eventTitle = event.id === "sakharpuda" && familyOrder === "bride" ? "Seemant Poojan" : event.title;
  const eventHall = familyInvite && event.id === "shadi" ? "Lawn Pacific 1" : event.hall;
  const eventVenue = familyOrder === "bride" && event.venue === "The Ocean Pearl Gardenia"
    ? "The Ocean Pearl Gardenia, Chhatarpur"
    : event.venue;
  const showDressCode = event.dressCode.length > 0 && (familyOrder !== "bride" || event.id === "haldi");

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
      data-invitation-page=""
      aria-labelledby={`${event.id}-title`}
    >
      <div className={styles.eventArtwork}>
        <img className={styles.eventPoster} src={event.imageSrc} alt={`Illustration for ${eventTitle}`} loading="lazy" decoding="async" />
        <video
          className={`${styles.eventVideo} ${videoReady ? styles.videoReady : ""}`}
          muted
          playsInline
          loop={familyInvite}
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
          {familyInvite
            ? <img className={styles.eventMonogram} src="/v15-2/ks-monogram-wine-small.png" alt="" aria-hidden="true" />
            : <span className={styles.cardFlourish} aria-hidden="true">✦</span>}
          <h2 id={`${event.id}-title`}>{eventTitle}</h2>
          <div className={styles.cardDivider} aria-hidden="true" />
          <a className={styles.calendarLink} href={`/api/calendar/${event.id}?side=${familyOrder}${familyInvite ? "&familyInvite=1" : ""}`} aria-label={`Add ${eventTitle} to your calendar`}>
            <span>{event.date}</span>
            <strong>{event.time}</strong>
          </a>
          {event.lunch && <p className={styles.mealLine}>{event.lunch}</p>}
          <p className={styles.eventRoom}>
            {eventHall && <span>{familyInvite && event.id === "shadi" ? eventHall : `${event.hallType} · ${eventHall}`}<br /></span>}
            <a
              className={styles.mapLink}
              href={event.mapUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${eventVenue} in maps`}
            >
              <LocationIcon />
              <span>{eventVenue}</span>
            </a>
          </p>
        </article>
        {showDressCode && (
          <div className={styles.dressPlate}>
            <span className={styles.dressLabel}>Dress code</span>
            <p className={styles.dressCode}>{event.dressCode.join(" · ")}</p>
          </div>
        )}
      </div>
      {navigationEnabled
        ? <NextPageButton className={styles.handoff} label={`Continue after ${eventTitle}`} />
        : <div className={styles.handoff} aria-hidden="true"><span>✥</span></div>}
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

function RSVP({ familyOrder, eventIds, inviteCode, optionalResponses = false }: { familyOrder: "groom" | "bride"; eventIds: EventId[]; inviteCode?: string; optionalResponses?: boolean }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [delhiAttending, setDelhiAttending] = useState("");
  const [receptionAttending, setReceptionAttending] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{ index: number; total: number; percent: number; fileName: string } | null>(null);
  const [showSavedDialog, setShowSavedDialog] = useState(false);
  const uploadBatchId = useRef<string | null>(null);
  const uploadIds = useRef(new Map<string, string>());
  const uploadedFiles = useRef(new Map<string, string>());
  const uploadedCount = useRef(0);
  const uploadPromise = useRef<Promise<void> | null>(null);
  const hasDelhiInvite = eventIds.some((eventId) => ["sakharpuda", "sangeet", "haldi", "shadi"].includes(eventId));
  const hasReceptionInvite = eventIds.includes("reception");

  function newUuid() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
      const random = Math.random() * 16 | 0;
      return (character === "x" ? random : (random & 3) | 8).toString(16);
    });
  }

  function uploadIdFile(file: File, batchId: string, uploadId: string, values: FormData, index: number, total: number) {
    return new Promise<number>((resolve, reject) => {
      const request = new XMLHttpRequest();
      const body = new FormData();
      body.append("idCard", file);
      body.append("familyOrder", familyOrder);
      body.append("delhiAttending", "yes");
      body.append("inviteCode", inviteCode ?? "mp-sk-sg-hw-we-re");
      body.append("batchId", batchId);
      body.append("uploadId", uploadId);
      body.append("fullName", String(values.get("fullName") ?? ""));
      request.open("POST", "/api/rsvp/id-upload");
      request.upload.onprogress = (progress) => {
        if (progress.lengthComputable) {
          setUploadProgress({ index, total, percent: Math.round((progress.loaded / progress.total) * 100), fileName: file.name });
        }
      };
      request.onerror = () => reject(new Error(`Could not upload ${file.name}. Please retry.`));
      request.onload = () => {
        let result: { error?: unknown; idCardsReceived?: unknown } = {};
        try { result = JSON.parse(request.responseText) as { error?: unknown; idCardsReceived?: unknown }; } catch { /* handled as a generic upload error */ }
        if (request.status < 200 || request.status >= 300) {
          reject(new Error(typeof result.error === "string" ? result.error : `Could not upload ${file.name}. Please retry.`));
          return;
        }
        resolve(typeof result.idCardsReceived === "number" ? result.idCardsReceived : 0);
      };
      setUploadProgress({ index, total, percent: 0, fileName: file.name });
      request.send(body);
    });
  }

  function startSelectedUploads(files: File[], values: FormData) {
    if (uploadPromise.current) return uploadPromise.current;
    const filesToUpload = files.filter((file) => !uploadedFiles.current.has(`${file.name}:${file.size}:${file.lastModified}`));
    if (filesToUpload.length === 0) return Promise.resolve();
    const oversizedFile = filesToUpload.find((file) => file.size > 3 * 1024 * 1024);
    if (oversizedFile) return Promise.reject(new Error(`${oversizedFile.name} is larger than 3 MB. Choose a smaller file.`));
    if (!String(values.get("fullName") ?? "").trim()) return Promise.reject(new Error("Enter your name before choosing ID files."));

    const batchId = uploadBatchId.current ?? newUuid();
    uploadBatchId.current = batchId;
    if (uploadedFiles.current.size === 0) uploadedCount.current = 0;
    const task = (async () => {
      for (let index = 0; index < filesToUpload.length; index += 1) {
        const file = filesToUpload[index];
        const key = `${file.name}:${file.size}:${file.lastModified}`;
        const uploadId = uploadIds.current.get(key) ?? newUuid();
        uploadIds.current.set(key, uploadId);
        uploadedCount.current = await uploadIdFile(file, batchId, uploadId, values, index + 1, filesToUpload.length);
        uploadedFiles.current.set(key, uploadId);
      }
      setUploadProgress({ index: files.length, total: files.length, percent: 100, fileName: "Uploads complete" });
    })();
    uploadPromise.current = task;
    void task.finally(() => {
      if (uploadPromise.current === task) uploadPromise.current = null;
    }).catch(() => { /* the caller handles upload errors */ });
    return task;
  }

  function handleIdFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    if (files.length === 0) {
      setUploadProgress(null);
      return;
    }
    setErrorMessage("");
    const values = new FormData(event.currentTarget.form ?? undefined);
    void startSelectedUploads(files, values).catch((error) => {
      setUploadProgress(null);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "We couldn’t upload those files. Please try again.");
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = event.currentTarget;
    const values = new FormData(form);
    const idCards = values.getAll("idCards").filter((value): value is File => value instanceof File && value.size > 0);
    if (!optionalResponses && hasDelhiInvite && delhiAttending === "yes" && idCards.length < Number(values.get("delhiPartySize"))) {
      setStatus("error");
      setErrorMessage("Please upload at least one ID card for each Delhi guest attending. You can include additional IDs too.");
      return;
    }
    const needsIdUploads = familyOrder === "groom" && hasDelhiInvite && delhiAttending === "yes" && (idCards.length > 0 || uploadedFiles.current.size > 0);
    if (idCards.some((file) => file.size > 3 * 1024 * 1024)) {
      setStatus("error");
      setErrorMessage("Each ID file must be 3 MB or smaller. There is no limit on the number of files.");
      return;
    }
    try {
      let batchId = "";
      if (needsIdUploads) {
        batchId = uploadBatchId.current ?? newUuid();
        uploadBatchId.current = batchId;
        await startSelectedUploads(idCards, values);
        if (uploadedCount.current > 0) setUploadProgress({ index: uploadedFiles.current.size, total: uploadedFiles.current.size, percent: 100, fileName: "Saving your RSVP" });
      }

      const payload = {
        fullName: values.get("fullName"),
        phone: values.get("phone"),
        familyOrder,
        inviteCode: inviteCode ?? "mp-sk-sg-hw-we-re",
        delhiAttending,
        delhiPartySize: values.get("delhiPartySize"),
        receptionAttending,
        receptionPartySize: values.get("receptionPartySize"),
        idUploadBatchId: needsIdUploads ? batchId : "",
        idCardsReceived: needsIdUploads ? uploadedCount.current : 0,
        wishes: values.get("wishes"),
        website: values.get("website"),
      };
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(typeof result?.error === "string" ? result.error : "RSVP could not be saved");
      }
      setStatus("sent");
      setErrorMessage("");
      setShowSavedDialog(true);
      setUploadProgress(null);
      form.reset();
      setDelhiAttending("");
      setReceptionAttending("");
      uploadBatchId.current = null;
      uploadIds.current.clear();
      uploadedFiles.current.clear();
      uploadedCount.current = 0;
      uploadPromise.current = null;
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "We couldn’t save your RSVP just yet. Please try again shortly.");
    }
  }

  return (
    <section className={styles.rsvpSection} id="rsvp" data-invitation-page="" aria-labelledby="rsvp-title">
      <div className={styles.rsvpFrame}>
        <div className={styles.rsvpPanel}>
          <span className={styles.chapterKicker}>We would love to celebrate with you</span>
          <h2 id="rsvp-title">Kindly RSVP</h2>
          <p>Please let us know if you can join us.</p>
          <form className={styles.rsvpForm} onSubmit={submit}>
            <label><span>Your name</span><input name="fullName" autoComplete="name" required maxLength={120} placeholder="Full name" /></label>
            <label><span>Phone number</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={32} placeholder="Your phone number" /></label>
            {hasDelhiInvite && (
              <>
                <label><span>Will your party join us for the Delhi celebrations? {optionalResponses && <em>(optional)</em>}</span><select name="delhiAttending" required={!optionalResponses} value={delhiAttending} onChange={(event) => setDelhiAttending(event.target.value)}><option value="">Select one</option><option value="yes">Joyfully accepts</option><option value="no">Regretfully declines</option></select></label>
                {delhiAttending === "yes" && <label><span>Delhi guests attending, including you</span><input name="delhiPartySize" type="number" min="1" max="20" required placeholder="Number of guests" /></label>}
                {delhiAttending === "yes" && <>
                  <label><span>ID cards for Delhi guests {optionalResponses && <em>(optional)</em>}</span><input name="idCards" type="file" accept="image/jpeg,image/png,application/pdf" multiple required={!optionalResponses} aria-describedby="id-upload-help" onChange={optionalResponses ? handleIdFileSelection : undefined} disabled={status === "sending" || uploadPromise.current !== null} /></label>
                  <span className={styles.privacyNote} id="id-upload-help">{optionalResponses ? "You can send your RSVP without documents. If you choose to upload IDs, use JPG, PNG, or PDF files up to 3 MB each. Files are stored privately for Delhi event entry checks." : "Upload at least one JPG, PNG, or PDF ID per Delhi guest, including you. Add as many files as you need; each file can be up to 3 MB. IDs are stored privately for Delhi event entry checks."}</span>
                  {uploadProgress && <div className={styles.uploadProgress} role="status" aria-live="polite">
                    <span>{uploadProgress.fileName === "Saving your RSVP" ? "Saving your RSVP…" : uploadProgress.fileName === "Uploads complete" ? `${uploadProgress.total} ID ${uploadProgress.total === 1 ? "file" : "files"} uploaded` : `Uploading ID ${uploadProgress.index} of ${uploadProgress.total}: ${uploadProgress.fileName}`}</span>
                    <progress max="100" value={uploadProgress.percent} aria-label={uploadProgress.fileName === "Saving your RSVP" ? "Saving your RSVP" : uploadProgress.fileName === "Uploads complete" ? "ID uploads complete" : `Uploading ${uploadProgress.fileName}`} />
                    {uploadProgress.fileName !== "Saving your RSVP" && uploadProgress.fileName !== "Uploads complete" && <span>{uploadProgress.percent}%</span>}
                  </div>}
                </>}
              </>
            )}
            {hasReceptionInvite && (
              <>
                <label><span>Will your party join us for the Reception in Pune? {optionalResponses && <em>(optional)</em>}</span><select name="receptionAttending" required={!optionalResponses} value={receptionAttending} onChange={(event) => setReceptionAttending(event.target.value)}><option value="">Select one</option><option value="yes">Joyfully accepts</option><option value="no">Regretfully declines</option></select></label>
                {receptionAttending === "yes" && <label><span>Pune Reception guests attending, including you</span><input name="receptionPartySize" type="number" min="1" max="20" required placeholder="Number of guests" /></label>}
              </>
            )}
            <label><span>Wishes for the couple <em>(optional)</em></span><textarea name="wishes" rows={3} maxLength={1200} placeholder="Share a wish for Kush & Sanya" /></label>
            <label className={styles.trapField} aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <button type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send your RSVP"}<span aria-hidden="true">✧</span></button>
            <span className={styles.privacyNote}>Your RSVP is shared with the hosts for planning.</span>
            {status === "error" && <span className={styles.error} role="alert">{errorMessage || "We couldn’t save your RSVP just yet. Please try again shortly."}</span>}
          </form>
          <a className={styles.returnLink} href="#top">Return to the invitation ↑</a>
        </div>
      </div>
      {showSavedDialog && <div className={styles.savedDialogBackdrop} role="presentation" onClick={() => setShowSavedDialog(false)}>
        <div className={styles.savedDialog} role="dialog" aria-modal="true" aria-labelledby="rsvp-saved-title" onClick={(event) => event.stopPropagation()}>
          <span className={styles.chapterKicker}>Thank you</span>
          <h3 id="rsvp-saved-title">Your RSVP is saved</h3>
          <p>We’ve received your response and shared it with the hosts.</p>
          <button type="button" onClick={() => setShowSavedDialog(false)}>Done</button>
        </div>
      </div>}
    </section>
  );
}

function BackgroundMusic({ pauseWhenHidden = false }: { pauseWhenHidden?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.28;
    let resumeWhenVisible = false;

    // Try to start on page load. Mobile browsers may require a user gesture,
    // so retry after the guest first taps or presses a key anywhere in the page.
    void audio.play().catch(() => undefined);
    const resumeAfterGesture = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-background-music-toggle]")) return;
      if (!audio.paused || audio.muted) return;
      void audio.play().catch(() => undefined);
    };
    const startFromBeginButton = () => {
      if (!audio.paused || audio.muted) return;
      void audio.play().catch(() => undefined);
    };
    const handleVisibilityChange = () => {
      if (!pauseWhenHidden) return;
      if (document.visibilityState === "hidden") {
        resumeWhenVisible = !audio.paused && !audio.muted;
        if (!audio.paused) audio.pause();
      } else if (resumeWhenVisible && !audio.muted) {
        resumeWhenVisible = false;
        void audio.play().catch(() => undefined);
      }
    };
    document.addEventListener("pointerdown", resumeAfterGesture, true);
    document.addEventListener("keydown", resumeAfterGesture, true);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener(START_WEDDING_MUSIC_EVENT, startFromBeginButton);
    return () => {
      document.removeEventListener("pointerdown", resumeAfterGesture, true);
      document.removeEventListener("keydown", resumeAfterGesture, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener(START_WEDDING_MUSIC_EVENT, startFromBeginButton);
      audio.pause();
    };
  }, [pauseWhenHidden]);

  function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.muted = false;
      setMuted(false);
      void audio.play().catch(() => undefined);
      return;
    }
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }

  const controlLabel = playing ? (muted ? "Unmute wedding music" : "Mute wedding music") : "Play wedding music";

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/kesariya-instrumental.m4a"
        loop
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        className={`${styles.musicControl} ${muted || !playing ? styles.musicControlQuiet : ""}`}
        type="button"
        data-background-music-toggle
        onClick={toggleMusic}
        aria-label={controlLabel}
        aria-pressed={playing && !muted}
        title={controlLabel}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M10 18V5l10-2v13M10 8l10-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="7" cy="18" rx="3" ry="2.2" fill="currentColor" />
          <ellipse cx="17" cy="16" rx="3" ry="2.2" fill="currentColor" />
          {(muted || !playing) && <path d="M3 3l18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
        </svg>
      </button>
    </>
  );
}

export default function Version16Experience({ invitation }: { invitation: Version16Invitation }) {
  const selected = useMemo(() => {
    const allowed = new Set(invitation.eventIds);
    return allCelebrations
      .filter((event) => allowed.has(event.id))
      .map((event) => invitation.familyInvite && invitation.familyOrder === "bride" && event.id === "sakharpuda"
        ? { ...event, title: "Seemant Poojan", time: "1:00 pm" }
        : invitation.familyInvite && invitation.familyOrder === "bride" && event.id === "sangeet"
          ? { ...event, time: "7:00 pm" }
        : event);
  }, [invitation.eventIds, invitation.familyInvite, invitation.familyOrder]);
  const firstDelhi = selected.findIndex((event) => event.city === "New Delhi");
  const hasDelhiEvents = firstDelhi !== -1;
  const hasReception = selected.some((event) => event.id === "reception");
  const openingNames = invitation.familyOrder === "bride" ? "Sanya & Kush" : "Kush & Sanya";
  const familyNames = invitation.familyInvite
    ? invitation.familyOrder === "bride" ? "Gupta and Teppalwar families" : "Teppalwar and Gupta families"
    : invitation.familyOrder === "bride" ? "The Gupta and Teppalwar families" : "The Teppalwar and Gupta families";
  const invitationDates = useMemo(() => {
    const eventDays: Record<EventId, number> = {
      "mandap-puja": 22,
      sakharpuda: 23,
      sangeet: 23,
      haldi: 24,
      shadi: 24,
      reception: 28,
    };
    const days = selected.map((event) => eventDays[event.id]);
    if (!days.length) return "";
    const first = Math.min(...days);
    const last = Math.max(...days);
    return first === last ? `${first} November 2026` : `${first}–${last} November 2026`;
  }, [selected]);
  const delhiEvents = selected.filter((event) => event.city === "New Delhi");
  const firstPageId = selected[0]?.city === "New Delhi" ? "journey-pune-delhi" : selected[0]?.id ?? "story";
  let delhiCount = 0;
  const flow: ReactNode[] = [];
  let outboundInserted = false;
  let returnInserted = false;

  selected.forEach((event) => {
    if (event.city === "New Delhi" && !outboundInserted) {
      flow.push(<MapJourney key="journey-pune-delhi" direction="north" familyInvite={invitation.familyInvite} navigationEnabled={invitation.navigationEnabled} />);
      outboundInserted = true;
    }
    if (event.id === "reception" && !returnInserted && hasDelhiEvents) {
      flow.push(<MapJourney key="journey-delhi-pune" direction="home" familyInvite={invitation.familyInvite} navigationEnabled={invitation.navigationEnabled} />);
      returnInserted = true;
    }
    const progress = event.city === "New Delhi" ? `${++delhiCount} of ${delhiEvents.length}` : undefined;
    flow.push(<EventScene key={event.id} event={event} familyOrder={invitation.familyOrder} familyInvite={invitation.familyInvite} navigationEnabled={invitation.navigationEnabled} progress={progress} />);
  });

  return (
    <main className={`${styles.page} ${invitation.familyInvite ? styles.familyInvite : ""}`}>
      <section className={styles.cover} id="top" data-invitation-page="" aria-labelledby="cover-title">
        <img className={styles.coverPoster} src="/v15-2/entry-poster.jpg" alt="A hand-painted palace entrance welcoming guests to Kush and Sanya’s wedding" fetchPriority="high" />
        <div className={styles.coverWash} aria-hidden="true" />
        <div className={styles.coverFrame}>
          <span className={styles.coverKicker}>A celebration across cities</span>
          <p className={styles.coverFamilies}>{familyNames} joyfully invite you to celebrate the auspicious union of</p>
          <h1 id="cover-title">{openingNames}</h1>
          <span className={styles.coverDates}>{invitation.familyInvite ? invitationDates : "22–28 November 2026"}</span>
          <div className={styles.coverActions}>
            <a
              className={styles.beginButton}
              href={`#${firstPageId}`}
              onClick={() => document.dispatchEvent(new Event(START_WEDDING_MUSIC_EVENT))}
            >
              Begin the journey <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
        {invitation.familyInvite
          ? <img className={styles.coverMonogram} src="/v15-2/ks-monogram-wine-small.png" alt="" aria-hidden="true" />
          : <span className={styles.coverOrnament} aria-hidden="true">✥</span>}
      </section>

      {flow}
      {hasReception && !hasDelhiEvents && <p className={styles.returnChapter}><span className={styles.chapterKicker}>Pune</span></p>}
      <section className={styles.storySection} id="story" data-invitation-page="" aria-labelledby="story-title">
        <div className={styles.storyFrame}>
          <div className={styles.storyPanel}>
            <span className={styles.chapterKicker}>A little of us</span>
            <h2 id="story-title">Everything we love has brought us to this moment—and to each other.</h2>
            <img
              className={styles.storyLogo}
              src="/v15-2/kush-sanya-wedding-logo.jpeg"
              alt="Kush and Sanya’s wedding logo, illustrated with coding, dancing, travel, food, and places they love"
              loading="lazy"
              decoding="async"
            />
            {invitation.navigationEnabled && invitation.familyOrder !== "bride" && <NextPageButton className={styles.storyArrow} label="Continue to RSVP" />}
          </div>
        </div>
      </section>
      {invitation.familyOrder !== "bride" && <RSVP familyOrder={invitation.familyOrder} eventIds={invitation.eventIds} inviteCode={invitation.inviteCode} optionalResponses={invitation.familyInvite === true} />}
      <footer className={styles.footer}>
        {invitation.familyInvite
          ? `With love, ${invitation.familyOrder === "bride" ? "Gupta" : "Teppalwar"} family`
          : <>With love, Kush &amp; Sanya</>}
        <span aria-hidden="true">✦</span>
      </footer>
      {invitation.backgroundMusic && <BackgroundMusic pauseWhenHidden={invitation.familyInvite} />}
    </main>
  );
}
