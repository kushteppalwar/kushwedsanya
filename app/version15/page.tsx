"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./version15.module.css";

function PalaceFrame() {
  const arch = "M10 618V162C10 73 89 20 220 8C351 20 430 73 430 162V618";

  return (
    <svg className={styles.archFrame} viewBox="0 0 440 620" preserveAspectRatio="none" aria-hidden="true">
      <path d={arch} fill="none" stroke="#f7eedc" strokeWidth="26" />
      <path d={arch} fill="none" stroke="#b48b4e" strokeWidth="3" />
      <path d="M24 618V165C24 90 98 39 220 27C342 39 416 90 416 165V618" fill="none" stroke="#e3c88d" strokeWidth="2" />
      <path d="M3 612h33M404 612h33M3 592h33M404 592h33" stroke="#b48b4e" strokeWidth="3" />
      <g fill="#f3e5c8" stroke="#ad8046" strokeWidth="2">
        <path d="M220 2c-7 8-7 13 0 18 7-5 7-10 0-18Zm-13 11c-10-1-13 3-10 10 8 2 12-2 10-10Zm26 0c10-1 13 3 10 10-8 2-12-2-10-10Z" />
        <path d="M220 37c-6 6-6 11 0 15 6-4 6-9 0-15Zm-13 8c-8-2-11 2-8 8 7 3 11 0 8-8Zm26 0c8-2 11 2 8 8-7 3-11 0-8-8Z" />
      </g>
      <g fill="none" stroke="#c39a5b" strokeWidth="2">
        <path d="M8 184c13-8 13-17 0-25m424 25c-13-8-13-17 0-25M8 226c13-8 13-17 0-25m424 25c-13-8-13-17 0-25" />
        <path d="M14 238c12-12 22-12 31 0m-31 20c12-12 22-12 31 0m380-20c-12-12-22-12-31 0m31 20c-12-12-22-12-31 0" />
      </g>
    </svg>
  );
}

function GateLeaf({ side }: { side: "left" | "right" }) {
  return (
    <div className={`${styles.gateLeaf} ${styles[side]}`} aria-hidden="true">
      <svg
        className={side === "right" ? styles.mirrored : undefined}
        viewBox="0 0 220 620"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`ivory-${side}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#fff9ef" />
            <stop offset=".3" stopColor="#f1dfca" />
            <stop offset=".58" stopColor="#fff6e8" />
            <stop offset="1" stopColor="#d9bd98" />
          </linearGradient>
          <linearGradient id={`panel-${side}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fff6ec" />
            <stop offset="1" stopColor="#e8d0bc" />
          </linearGradient>
          <pattern id={`jali-${side}`} width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M16 3c-8 5-10 11 0 20 10-9 8-15 0-20ZM16 20v10m0-16c-5 0-8-2-9-6m9 10c5 0 8-2 9-6" fill="none" stroke="#a98062" strokeOpacity=".56" strokeWidth="1.1" />
            <circle cx="16" cy="11" r="2" fill="#d0908d" fillOpacity=".7" />
          </pattern>
        </defs>
        <path d="M0 620V79Q3 34 220 4V620Z" fill={`url(#ivory-${side})`} stroke="#a98154" strokeWidth="6" />
        <path d="M11 612V91Q17 57 209 17V612Z" fill="none" stroke="#fffaf0" strokeWidth="5" />
        <path d="M18 608V99Q25 66 202 27V608Z" fill="none" stroke="#c4986b" strokeWidth="2" />
        <path d="M28 604V112Q34 82 191 45V604Z" fill="none" stroke="#f6e6d4" strokeWidth="2" />
        <path d="M34 44V599M186 17V599" stroke="#c99e79" strokeWidth="1.5" strokeDasharray="2 5" />
        <path d="M43 86c36 12 69 14 99 8m-99 24c36 12 69 14 99 8M43 566c36-12 69-14 99-8m-99-24c36-12 69-14 99-8" fill="none" stroke="#d18f8b" strokeOpacity=".72" strokeWidth="2" />
        {[145, 335, 525].map((y) => (
          <g key={y}>
            <path d={`M42 ${y + 57}V${y - 15}Q42 ${y - 59} 110 ${y - 61}Q178 ${y - 59} 178 ${y - 15}V${y + 57}Z`} fill={`url(#panel-${side})`} stroke="#a98154" strokeWidth="3" />
            <path d={`M50 ${y + 49}V${y - 14}Q50 ${y - 50} 110 ${y - 52}Q170 ${y - 50} 170 ${y - 14}V${y + 49}Z`} fill={`url(#jali-${side})`} stroke="#fff9ef" strokeWidth="3" />
            <path d={`M59 ${y + 40}V${y - 12}Q59 ${y - 41} 110 ${y - 43}Q161 ${y - 41} 161 ${y - 12}V${y + 40}Z`} fill="none" stroke="#c4986b" strokeWidth="1.5" />
            <path d={`M110 ${y - 25}c-11 7-11 17 0 23 11-6 11-16 0-23Zm-9 9c-9-4-15 1-11 10 8 4 13 0 11-10Zm18 0c9-4 15 1 11 10-8 4-13 0-11-10Z`} fill="#f7e8dc" stroke="#a97c64" strokeWidth="1.5" />
            <circle cx="110" cy={y - 5} r="5" fill="#d58f8f" stroke="#fff7e9" strokeWidth="2" />
            <path d={`M34 ${y + 56}h152`} stroke="#a98154" strokeWidth="2" />
            <path d={`M40 ${y + 61}h140`} stroke="#fff9ef" strokeWidth="2" />
            <circle cx="28" cy={y + 58} r="4" fill="#d3a36f" stroke="#fff7e9" strokeWidth="2" />
            <circle cx="192" cy={y + 58} r="4" fill="#d3a36f" stroke="#fff7e9" strokeWidth="2" />
          </g>
        ))}
        <path d="M0 599h220M12 610h208" stroke="#a27a52" strokeWidth="3" />
        <path d="M9 600h198" stroke="#fff8ea" strokeWidth="2" strokeDasharray="3 4" />
        <circle cx="208" cy="367" r="13" fill="#d6ad82" stroke="#fff7e9" strokeWidth="4" />
        <circle cx="208" cy="367" r="6" fill="#a97d58" stroke="#f8eadb" strokeWidth="2" />
        <path d="M208 345c-7 6-7 11 0 15 7-4 7-9 0-15Zm-14 8c-7-2-10 2-7 8 6 2 9 0 7-8Zm28 0c7-2 10 2 7 8-6 2-9 0-7-8Z" fill="#e6c59e" stroke="#a98154" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export default function Version15Page() {
  const [opened, setOpened] = useState(false);
  const [publicWishes, setPublicWishes] = useState<string[]>([]);
  const [rsvpState, setRsvpState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    fetch("/api/rsvp", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { wishes?: unknown } | null) => {
        if (Array.isArray(data?.wishes)) {
          setPublicWishes(data.wishes.filter((wish): wish is string => typeof wish === "string"));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-event-reveal]"));
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const section = entry.target as HTMLElement;
        section.classList.add(styles.eventVisible);
        observer.unobserve(section);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -7% 0px" });

    sections.forEach((section) => {
      section.classList.add(styles.eventRevealPending);
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const accents = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll-accent]"));
    if (!accents.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const updateAccents = () => {
      frame = 0;
      const viewportHeight = window.innerHeight || 1;
      accents.forEach((accent) => {
        const section = accent.closest("section");
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
        accent.style.setProperty("--scroll-shift", `${((0.5 - progress) * 14).toFixed(1)}px`);
      });
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateAccents);
    };

    updateAccents();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  async function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRsvpState("sending");
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
          guestNames: values.get("guestNames"),
          wishes: values.get("wishes"),
          publishWish: values.get("publishWish") === "on",
          website: values.get("website"),
        }),
      });
      if (!response.ok) throw new Error("RSVP could not be saved");
      setRsvpState("sent");
      form.reset();
      try {
        const wishesResponse = await fetch("/api/rsvp", { cache: "no-store" });
        if (wishesResponse.ok) {
          const data = (await wishesResponse.json()) as { wishes?: unknown };
          if (Array.isArray(data.wishes)) setPublicWishes(data.wishes.filter((wish): wish is string => typeof wish === "string"));
        }
      } catch {
        // Saving the RSVP should still be reported as successful if the public wishes feed is temporarily unavailable.
      }
    } catch {
      setRsvpState("error");
    }
  }

  const celebrations = [
    {
      id: "sakharpuda",
      title: "Sakharpuda",
      number: "01",
      artwork: "/v15/sakharpuda-bright.png",
      alt: "A hand-painted Sakharpuda ceremony in an ivory palace courtyard",
      date: "Monday, 23 November 2026",
      time: "1:30 pm",
      caption: "A sweet beginning, shared with our families",
      dressCode: ["Women · Elegant silk-border saree", "Men · Classic kurta-pajama"],
      hall: "Pacific 2",
      hallType: "Hall",
      venue: "The Ocean Pearl Gardenia",
      venueLink: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
    },
    {
      id: "sangeet",
      title: "Sangeet",
      number: "02",
      artwork: "/v15/sangeet-couple-bright.png",
      alt: "A hand-painted couple dancing in a palace garden at twilight",
      date: "Monday, 23 November 2026",
      time: "7:30 pm onwards",
      caption: "An evening of music, laughter & celebration",
      dressCode: ["Women · Fusion ensembles or an elegant gown", "Men · Contemporary Indo-Western or sharp Western silhouettes"],
      hall: "Pacific 2",
      hallType: "Hall",
      venue: "The Ocean Pearl Gardenia",
      venueLink: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
    },
    {
      id: "haldi",
      title: "Haldi",
      number: "03",
      artwork: "/v15/haldi-bright.png",
      alt: "A hand-painted Haldi celebration beneath marigold flowers",
      date: "Tuesday, 24 November 2026",
      time: "11:00 am",
      caption: "An afternoon of sunshine, flowers & family",
      dressCode: ["Shades of yellow"],
      hall: "Pool Side",
      hallType: "Area",
      venue: "The Ocean Pearl Gardenia",
      venueLink: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
    },
    {
      id: "shadi",
      title: "Shadi",
      number: "04",
      artwork: "/v15/shadi-bright.png",
      alt: "A hand-painted wedding ceremony beneath a palace mandap",
      date: "Tuesday, 24 November 2026",
      time: "7:30 pm",
      caption: "Together, surrounded by the people we love",
      dressCode: ["Traditional attire"],
      hall: "Pacific 1",
      hallType: "Hall",
      venue: "The Ocean Pearl Gardenia",
      venueLink: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
    },
    {
      id: "reception",
      title: "Reception",
      number: "05",
      artwork: "/v15/reception-bright.png",
      alt: "A faceless couple in a black saree and tuxedo at a palace reception",
      date: "Saturday, 28 November 2026",
      time: "8:00 pm",
      caption: "A celebration with the people we love",
      dressCode: ["Western attire"],
      venue: "Mayfield Ivy Garden & Banquet",
      hall: null,
      hallType: null,
      venueLink: "https://maps.app.goo.gl/3KLxTzHL7ZCNZToA6",
    },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.invitation} id="top">
        <div className={`${styles.scene} ${opened ? styles.opened : ""}`}>
          <div className={styles.painting}>
            <img
              className={styles.paintingImage}
              src="/v15/ganpati-palace-v2.png"
              alt="A bright hand-painted ivory palace with Ganpati seated beneath a rose-flowered arch"
            />
          </div>

          <header className={styles.greeting}>
            <span className={styles.eyebrow}>॥ श्री गणेशाय नमः ॥</span>
            <p className={styles.subtitle}>Join us for the wedding of</p>
            <h1>Kush &amp; Sanya</h1>
            <p className={styles.eventDetails}>23rd, 24th &amp; 28th November 2026 · New Delhi</p>
            <a
              className={styles.venueLink}
              href="https://maps.app.goo.gl/CMM7ip63UH2w2Cka7"
              target="_blank"
              rel="noreferrer"
              aria-label="The Ocean Pearl Gardenia on Google Maps"
            >
              The Ocean Pearl Gardenia ↗
            </a>
          </header>

          <div className={`${styles.gate} ${opened ? styles.opened : ""}`}>
            <PalaceFrame />
            <GateLeaf side="left" />
            <GateLeaf side="right" />
          </div>

          {!opened && (
            <button className={styles.openButton} onClick={() => setOpened(true)}>
              <span>Open the invitation</span>
              <span aria-hidden="true">✧</span>
            </button>
          )}
          {opened && <div className={styles.bottomNote} aria-live="polite">Scroll down for the celebrations ↓</div>}
        </div>
      </div>

      {celebrations.map((event, index) => (
        <section
          className={`${styles.eventPage} ${styles.eventSplitPage} ${event.id === "shadi" ? styles.shadiEvent : ""}`}
          id={index === 0 ? "celebrations" : event.id}
          aria-labelledby={`${event.id}-title`}
          data-event-reveal
          key={event.id}
        >
          <img className={styles.eventArtwork} src={event.artwork} alt={event.alt} />
          <div className={styles.eventFrame}>
            <div className={styles.eventCopyPlate}>
              <span className={styles.eventFlourish} data-scroll-accent aria-hidden="true">✧</span>
              <p className={styles.eventEyebrow}>{index === 0 ? "The celebrations begin" : "With love, we celebrate"}</p>
              <span className={styles.eventNumber} aria-hidden="true">{event.number}</span>
              <h2 id={`${event.id}-title`}>{event.title}</h2>
              <div className={styles.eventDivider} aria-hidden="true"><span>✦</span></div>
              <p className={styles.eventDate}>{event.date} · {event.time}</p>
              {event.hall && <p className={styles.eventHall}>{event.hallType} · {event.hall}</p>}
              {event.venue && event.venueLink && (
                <div className={styles.eventVenueGroup}>
                  <span className={styles.eventVenueLabel}>Venue</span>
                  <a className={styles.eventVenue} href={event.venueLink} target="_blank" rel="noreferrer">
                    {event.venue} ↗
                  </a>
                </div>
              )}
            </div>
            <div className={styles.eventFooterPlate}>
              <p className={styles.eventCaption}>{event.caption}</p>
              {event.dressCode.length > 0 && <div className={styles.eventDressCode}>
                <span className={styles.dressCodeLabel}>Dress code</span>
                {event.dressCode.map((line) => <span key={line}>{line}</span>)}
              </div>}
            </div>
          </div>
          <span className={styles.eventHandoff} aria-hidden="true">✥</span>
        </section>
      ))}

      <section className={styles.rsvpSection} aria-labelledby="rsvp-title">
        <div className={styles.rsvpInner}>
          <p className={styles.sectionEyebrow}>We would love to celebrate with you</p>
          <h2 id="rsvp-title">Kindly RSVP</h2>
          <p className={styles.rsvpIntro}>Please let us know if you can join us and who will be travelling with you.</p>

          <form className={styles.rsvpForm} onSubmit={submitRsvp}>
            <label className={styles.formField}>
              <span>Your name</span>
              <input name="fullName" autoComplete="name" required maxLength={120} placeholder="Full name" />
            </label>

            <label className={styles.formField}>
              <span>Phone number</span>
              <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={32} placeholder="Your phone number" />
            </label>

            <label className={styles.formField}>
              <span>Will you be joining us?</span>
              <select name="attending" required defaultValue="">
                <option value="" disabled>Select one</option>
                <option value="yes">Joyfully accepts</option>
                <option value="no">Regretfully declines</option>
              </select>
            </label>

            <label className={styles.formField}>
              <span>Total people travelling with you, including yourself</span>
              <input name="partySize" type="number" min="1" max="20" required placeholder="Number of guests" />
            </label>

            <label className={styles.formField}>
              <span>Names of accompanying guests <em>(optional)</em></span>
              <input name="guestNames" maxLength={500} placeholder="Guest names" />
            </label>

            <label className={styles.formField}>
              <span>Wishes for the couple <em>(optional)</em></span>
              <textarea name="wishes" rows={3} maxLength={1200} placeholder="Share a wish for Kush & Sanya" />
            </label>

            <label className={styles.publishWishField}>
              <input name="publishWish" type="checkbox" />
              <span>I’m happy for my wish to appear on the invitation.</span>
            </label>

            <label className={styles.trapField} aria-hidden="true">
              Leave this field empty
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>

            <button className={styles.rsvpButton} type="submit" disabled={rsvpState === "sending"}>
              {rsvpState === "sending" ? "Sending…" : "Send your RSVP"}
              <span aria-hidden="true">✧</span>
            </button>
            <p className={styles.privacyNote}>Your RSVP is shared with the hosts for planning. Wishes appear here only if you choose to share them.</p>
            {rsvpState === "sent" && <p className={styles.formMessage} role="status">Thank you. Your RSVP has been received.</p>}
            {rsvpState === "error" && <p className={styles.formError} role="alert">We couldn’t save your RSVP just yet. Please try again shortly.</p>}
          </form>

          <div className={styles.wishesBoard} aria-labelledby="wishes-title">
            <p className={styles.wishesEyebrow}>From family & friends</p>
            <h3 id="wishes-title">Wishes for the couple</h3>
            {publicWishes.length > 0 ? (
              <ul className={styles.wishesList}>
                {publicWishes.map((wish, index) => <li key={`${index}-${wish.slice(0, 24)}`}>{wish}</li>)}
              </ul>
            ) : (
              <p className={styles.noWishes}>Be the first to leave Kush & Sanya a wish.</p>
            )}
          </div>
        </div>
      </section>

      <a className={styles.endReturnLink} href="#top">Return to the invitation ↑</a>
    </main>
  );
}
