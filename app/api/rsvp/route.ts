import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RsvpPayload = {
  fullName?: unknown;
  phone?: unknown;
  attending?: unknown;
  partySize?: unknown;
  guestNames?: unknown;
  wishes?: unknown;
  publishWish?: unknown;
  website?: unknown;
};

function asText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function getSheetsConfig() {
  const endpoint = process.env.GOOGLE_SHEETS_RSVP_URL;
  const sharedSecret = process.env.RSVP_SHEETS_SECRET;
  if (!endpoint || !sharedSecret) return null;

  try {
    const endpointUrl = new URL(endpoint);
    if (endpointUrl.protocol === "https:" && endpointUrl.hostname === "script.google.com" && endpointUrl.pathname.startsWith("/macros/s/")) {
      return { endpointUrl, sharedSecret };
    }
  } catch {
    return null;
  }
  return null;
}

async function postToSheets(body: Record<string, unknown>) {
  const config = getSheetsConfig();
  if (!config) return null;
  try {
    const response = await fetch(config.endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, secret: config.sharedSecret }),
      cache: "no-store",
    });
    const result = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    return response.ok && result?.ok === true ? result : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const result = await postToSheets({ action: "get-wishes" });
  if (!result || !Array.isArray(result.wishes)) {
    return NextResponse.json({ wishes: [] });
  }
  const wishes = result.wishes
    .filter((wish): wish is string => typeof wish === "string")
    .map((wish) => wish.trim().slice(0, 1200))
    .filter(Boolean)
    .slice(0, 20);
  return NextResponse.json({ wishes }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let payload: RsvpPayload;

  try {
    payload = (await request.json()) as RsvpPayload;
  } catch {
    return NextResponse.json({ error: "Invalid RSVP data." }, { status: 400 });
  }

  // Quietly discard bot submissions caught by the hidden honeypot field.
  if (asText(payload.website, 200)) {
    return NextResponse.json({ ok: true });
  }

  const fullName = asText(payload.fullName, 120);
  const phone = asText(payload.phone, 32);
  const attending = payload.attending === "yes" ? "Yes" : payload.attending === "no" ? "No" : "";
  const partySize = Number(payload.partySize);
  const guestNames = asText(payload.guestNames, 500);
  const wishes = asText(payload.wishes, 1200);
  const publishWish = payload.publishWish === true && wishes.length > 0;
  const validPhone = /^[+\d\s().-]+$/.test(phone) && phone.replace(/\D/g, "").length >= 7 && phone.replace(/\D/g, "").length <= 15;

  if (!fullName || !validPhone || !attending || !Number.isInteger(partySize) || partySize < 1 || partySize > 20) {
    return NextResponse.json({ error: "Please complete the required RSVP fields." }, { status: 400 });
  }

  if (!getSheetsConfig()) {
    return NextResponse.json({ error: "RSVP storage is not configured yet." }, { status: 503 });
  }
  const result = await postToSheets({
    fullName,
    phone,
    attending,
    partySize,
    guestNames,
    wishes,
    publishWish,
  });
  if (!result) return NextResponse.json({ error: "The RSVP could not be saved. Please try again." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
