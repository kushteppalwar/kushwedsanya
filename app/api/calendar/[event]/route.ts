import { NextResponse } from "next/server";

type CalendarEvent = {
  title: string;
  date: string;
  time: string;
  location: string;
  durationMinutes: number;
  mapUrl: string;
  description?: string;
};

const events: Record<string, CalendarEvent> = {
  "mandap-puja": {
    title: "Mandap Puja",
    date: "2026-11-22",
    time: "10:00",
    location: "Pristine Royale, Pune",
    durationMinutes: 180,
    mapUrl: "https://maps.app.goo.gl/dRNXLzzNU8i4fCqg8",
    description: "Lunch at 1:00 pm.",
  },
  sakharpuda: {
    title: "Seemant Poojan & Mehendi",
    date: "2026-11-23",
    time: "13:30",
    location: "Pacific 2, The Ocean Pearl Gardenia, New Delhi",
    durationMinutes: 120,
    mapUrl: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
  },
  sangeet: {
    title: "Tilak & Sangeet",
    date: "2026-11-23",
    time: "19:30",
    location: "Pacific 2, The Ocean Pearl Gardenia, New Delhi",
    durationMinutes: 120,
    mapUrl: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
  },
  haldi: {
    title: "Haldi",
    date: "2026-11-24",
    time: "10:00",
    location: "Pool Side, The Ocean Pearl Gardenia, New Delhi",
    durationMinutes: 120,
    mapUrl: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
  },
  shadi: {
    title: "Shaadi",
    date: "2026-11-24",
    time: "19:30",
    location: "Pacific 1, The Ocean Pearl Gardenia, New Delhi",
    durationMinutes: 120,
    mapUrl: "https://maps.app.goo.gl/CMM7ip63UH2w2Cka7",
  },
  reception: {
    title: "Reception",
    date: "2026-11-28",
    time: "20:00",
    location: "Swastik Banquet Lawns (Mayfield), Pune",
    durationMinutes: 120,
    mapUrl: "https://maps.app.goo.gl/iHYujWGfTm6Bc9KN9",
  },
};

function escapeIcal(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ event: string }> },
) {
  const { event } = await params;
  const calendarEvent = events[event];
  if (!calendarEvent) return NextResponse.json({ error: "Unknown event." }, { status: 404 });

  const url = new URL(request.url);
  const isBrideSide = url.searchParams.get("side") === "bride";
  const isFamilyInvite = url.searchParams.get("familyInvite") === "1";
  const brideSeemant = isFamilyInvite && event === "sakharpuda" && isBrideSide;
  const brideSangeet = isFamilyInvite && event === "sangeet" && isBrideSide;
  const title = brideSeemant ? "Seemant Poojan" : calendarEvent.title;
  const time = brideSeemant ? "13:00" : brideSangeet ? "19:00" : calendarEvent.time;
  const start = new Date(`${calendarEvent.date}T${time}:00+05:30`);
  const end = new Date(start.getTime() + calendarEvent.durationMinutes * 60_000);
  const description = [calendarEvent.description, calendarEvent.mapUrl].filter(Boolean).join("\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kush and Sanya//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event}@kushwedsanya.vercel.app`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(start)}`,
    `DTEND:${formatUtc(end)}`,
    `SUMMARY:${escapeIcal(title)}`,
    `LOCATION:${escapeIcal(calendarEvent.location)}`,
    `DESCRIPTION:${escapeIcal(description)}`,
    `URL:${calendarEvent.mapUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(`${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="kush-sanya-${event}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
