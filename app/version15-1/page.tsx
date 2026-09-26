"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./version15-1.module.css";

const SCRUB_CLIP_SECONDS = 5;

export type InvitationOptions = {
  familyOrder?: "groom" | "bride";
  eventIds?: Array<"sakharpuda" | "sangeet" | "haldi" | "shadi" | "reception">;
};

export default function Version15Page({ invitation }: { invitation?: InvitationOptions }) {
  const [entryPlaying, setEntryPlaying] = useState(false);
  const [entryComplete, setEntryComplete] = useState(false);
  const [rsvpState, setRsvpState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function openTheInvitation() {
    if (entryPlaying || entryComplete) return;

    const video = document.querySelector<HTMLVideoElement>("[data-entry-video]");
    if (!video) {
      setEntryComplete(true);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const revealGanpati = () => {
        video.currentTime = Math.max(0, video.duration - 0.04);
        setEntryComplete(true);
      };
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) revealGanpati();
      else video.addEventListener("loadedmetadata", revealGanpati, { once: true });
      return;
    }

    setEntryPlaying(true);
    try {
      await video.play();
    } catch {
      setEntryPlaying(false);
    }
  }

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
  }, [entryComplete]);

  useEffect(() => {
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>("[data-scroll-video]"));
    if (!videos.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const showStillArtwork = (video: HTMLVideoElement) => {
        if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;
        video.currentTime = Math.min(2.5, Math.max(0, video.duration - 0.04));
        video.pause();
      };
      const onLoaded = (event: Event) => showStillArtwork(event.currentTarget as HTMLVideoElement);
      videos.forEach((video) => {
        showStillArtwork(video);
        video.addEventListener("loadedmetadata", onLoaded, { once: true });
      });
      return () => videos.forEach((video) => video.removeEventListener("loadedmetadata", onLoaded));
    }

    let frame = 0;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const syncFramesToScroll = () => {
      frame = 0;
      if (document.visibilityState === "hidden") return;

      videos.forEach((video) => {
        const scene = video.closest<HTMLElement>("[data-scroll-scene]");
        if (!scene || video.readyState < HTMLMediaElement.HAVE_METADATA) return;

        const sceneRect = scene.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 1;
        const halfwayVisibleStart = viewportHeight - sceneRect.height / 2;
        const travelUntilSceneExits = viewportHeight + sceneRect.height / 2;
        const progress = clamp((halfwayVisibleStart - sceneRect.top) / travelUntilSceneExits);
        const targetTime = Math.min(SCRUB_CLIP_SECONDS * progress, Math.max(0, video.duration - 0.04));

        if (Math.abs(video.currentTime - targetTime) > 0.06) video.currentTime = targetTime;
        video.pause();
      });
    };
    const requestSync = () => {
      if (!frame) frame = window.requestAnimationFrame(syncFramesToScroll);
    };

    videos.forEach((video) => {
      video.pause();
      video.addEventListener("loadedmetadata", requestSync);
    });
    requestSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);
    document.addEventListener("visibilitychange", requestSync);

    return () => {
      videos.forEach((video) => video.removeEventListener("loadedmetadata", requestSync));
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
      document.removeEventListener("visibilitychange", requestSync);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [entryComplete]);

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
          wishes: values.get("wishes"),
          website: values.get("website"),
        }),
      });
      if (!response.ok) throw new Error("RSVP could not be saved");
      setRsvpState("sent");
      form.reset();
    } catch {
      setRsvpState("error");
    }
  }

  const celebrations = [
    {
      id: "sakharpuda",
      title: "Seemant Poojan & Mehendi",
      videoSrc: "/v15-1/sakharpuda.mp4",
      date: "Monday, 23 November 2026",
      time: "1:30 pm",
      dressCode: ["Traditional Indian attire"],
      hall: "Pacific 2",
      hallType: "Hall",
      venue: "The Ocean Pearl Gardenia",
      city: "New Delhi",
      venueLink: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
    },
    {
      id: "sangeet",
      title: "Sangeet",
      videoSrc: "/v15-1/sangeet.mp4",
      date: "Monday, 23 November 2026",
      time: "7:30 pm onwards",
      dressCode: ["Indo-Western"],
      hall: "Pacific 2",
      hallType: "Hall",
      venue: "The Ocean Pearl Gardenia",
      city: "New Delhi",
      venueLink: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
    },
    {
      id: "haldi",
      title: "Haldi",
      videoSrc: "/v15-1/haldi.mp4",
      date: "Tuesday, 24 November 2026",
      time: "11:00 am",
      dressCode: ["Shades of yellow"],
      hall: "Pool Side",
      hallType: "Area",
      venue: "The Ocean Pearl Gardenia",
      city: "New Delhi",
      venueLink: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
    },
    {
      id: "shadi",
      title: "Shadi",
      videoSrc: "/v15-1/shadi.mp4",
      date: "Tuesday, 24 November 2026",
      time: "7:30 pm",
      dressCode: ["Traditional attire"],
      hall: "Pacific 1",
      hallType: "Hall",
      venue: "The Ocean Pearl Gardenia",
      city: "New Delhi",
      venueLink: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
    },
    {
      id: "reception",
      title: "Reception",
      videoSrc: "/v15-1/reception.mp4",
      date: "Saturday, 28 November 2026",
      time: "8:00 pm",
      dressCode: ["Western attire"],
      hall: null,
      hallType: null,
      venue: "Swastik Banquet Lawns (Mayfield)",
      city: "Pune",
      venueLink: "https://maps.app.goo.gl/iHYujWGfTm6Bc9KN9",
    },
  ];
  const visibleCelebrations = invitation?.eventIds
    ? celebrations.filter((event) => invitation.eventIds?.includes(event.id as NonNullable<InvitationOptions["eventIds"]>[number]))
    : celebrations;
  const familyOrder = invitation?.familyOrder;

  return (
    <main className={styles.page}>
      <div
        className={`${styles.invitation} ${entryPlaying ? styles.entryPlaying : ""}`}
        id="top"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) return;
          void openTheInvitation();
        }}
      >
        <div className={styles.scene}>
          <div className={styles.painting}>
            <video
              className={`${styles.paintingImage} ${styles.entryVideo}`}
              muted
              playsInline
              preload="auto"
              data-entry-video
              aria-hidden="true"
              onEnded={() => {
                setEntryPlaying(false);
                setEntryComplete(true);
              }}
            >
              <source src="/v15-1/entry.mp4" type="video/mp4" />
            </video>
          </div>

          {entryComplete && (
            <header className={styles.greeting}>
              <p className={styles.subtitle}>
                {familyOrder === "bride"
                  ? "The Gupta and Teppalwar families joyfully invite you to celebrate the auspicious union of"
                  : "The Teppalwar and Gupta families joyfully invite you to celebrate the auspicious union of"}
              </p>
              <h1>{familyOrder === "bride" ? "Sanya & Kush" : "Kush & Sanya"}</h1>
            </header>
          )}

          {!entryComplete && (
            <button className={styles.openButton} disabled={entryPlaying}>
              <span>{entryPlaying ? "The gates are opening…" : "Open the invitation"}</span>
              <span aria-hidden="true">✧</span>
            </button>
          )}
          <a className={styles.bottomNote} href="#celebrations">Scroll down for the celebrations ↓</a>
        </div>
      </div>

      <>
      {visibleCelebrations.map((event, index) => (
        <section
          className={`${styles.eventPage} ${styles.eventSplitPage} ${event.id === "shadi" ? styles.shadiEvent : ""} ${event.id === "sakharpuda" ? styles.sakharpudaEvent : ""}`}
          id={index === 0 ? "celebrations" : event.id}
          aria-labelledby={`${event.id}-title`}
          data-event-reveal
          data-scroll-scene
          key={event.id}
        >
          <video
            className={`${styles.eventArtwork} ${styles.eventScrubVideo} ${styles.scrubVideo}`}
            muted
            playsInline
            preload="auto"
            data-scroll-video
            aria-hidden="true"
          >
            <source src={event.videoSrc} type="video/mp4" />
          </video>
          <div className={styles.eventFrame}>
            <div className={styles.eventCopyPlate}>
              <span className={styles.eventFlourish} aria-hidden="true">✧</span>
              <h2 id={`${event.id}-title`}>{event.title}</h2>
              <div className={styles.eventDivider} aria-hidden="true"><span>✦</span></div>
              <p className={styles.eventDate}>{event.date}</p>
              <p className={styles.eventTime}>{event.time}</p>
              {event.hall && <p className={styles.eventHall}>{event.hallType} · {event.hall}</p>}
              <a className={styles.eventVenue} href={event.venueLink} target="_blank" rel="noreferrer">
                {event.venue} ↗
              </a>
              <p className={styles.eventCity}>{event.city}</p>
            </div>
            <div className={styles.eventFooterPlate}>
              {event.dressCode.length > 0 && <div className={styles.eventDressCode}>
                <span className={styles.dressCodeLabel}>Dress code</span>
                {event.dressCode.map((line) => <span key={line}>{line}</span>)}
              </div>}
            </div>
          </div>
          <span className={styles.eventHandoff} aria-hidden="true">✥</span>
        </section>
      ))}

      <section className={styles.storySection} aria-labelledby="story-title">
        <div className={styles.storyPanel}>
          <h2 id="story-title" className={styles.storyTitle}>A little of us</h2>
          <p className={styles.storyLine}>Everything we love has brought us to this moment—and to each other.</p>
          <img
            className={styles.storyLogo}
            src="/v15-1/kush-sanya-wedding-logo.jpeg"
            alt="Kush and Sanya’s wedding logo, illustrated with coding, dancing, travel, food, and places they love"
            loading="lazy"
          />
        </div>
      </section>

      <section className={styles.rsvpSection} aria-labelledby="rsvp-title">
        <div className={styles.rsvpInner}>
          <p className={styles.sectionEyebrow}>We would love to celebrate with you</p>
          <h2 id="rsvp-title">Kindly RSVP</h2>
          <p className={styles.rsvpIntro}>Please let us know if you can join us and how many people will be travelling with you.</p>

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
              <span>Wishes for the couple <em>(optional)</em></span>
              <textarea name="wishes" rows={3} maxLength={1200} placeholder="Share a wish for Kush & Sanya" />
            </label>

            <label className={styles.trapField} aria-hidden="true">
              Leave this field empty
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>

            <button className={styles.rsvpButton} type="submit" disabled={rsvpState === "sending"}>
              {rsvpState === "sending" ? "Sending…" : "Send your RSVP"}
              <span aria-hidden="true">✧</span>
            </button>
            <p className={styles.privacyNote}>Your RSVP is shared with the hosts for planning.</p>
            {rsvpState === "sent" && <p className={styles.formMessage} role="status">Thank you. Your RSVP has been received.</p>}
            {rsvpState === "error" && <p className={styles.formError} role="alert">We couldn’t save your RSVP just yet. Please try again shortly.</p>}
          </form>

        </div>
      </section>

      <a className={styles.endReturnLink} href="#top">Return to the invitation ↑</a>
      </>
    </main>
  );
}
