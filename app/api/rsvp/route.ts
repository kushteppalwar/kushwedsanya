import { NextResponse } from "next/server";
import { getInvitationEventIds } from "@/lib/invitation-events";
import { isRsvpSheetsConfigured, postToRsvpSheets } from "@/lib/rsvp-sheets";

export const runtime = "nodejs";

type RsvpPayload = {
  fullName?: unknown;
  phone?: unknown;
  familyOrder?: unknown;
  inviteCode?: unknown;
  delhiAttending?: unknown;
  delhiPartySize?: unknown;
  receptionAttending?: unknown;
  receptionPartySize?: unknown;
  idUploadBatchId?: unknown;
  idCardsReceived?: unknown;
  wishes?: unknown;
  website?: unknown;
};

function asText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function GET() {
  const result = await postToRsvpSheets({ action: "get-wishes" });
  if (!result || !Array.isArray(result.wishes)) return NextResponse.json({ wishes: [] });
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

  if (asText(payload.website, 200)) return NextResponse.json({ ok: true });

  const fullName = asText(payload.fullName, 120);
  const phone = asText(payload.phone, 32);
  const familySide = payload.familyOrder === "groom" ? "Groom" : payload.familyOrder === "bride" ? "Bride" : "";
  const inviteCode = asText(payload.inviteCode, 80);
  const invitedEvents = getInvitationEventIds(inviteCode);
  const hasDelhiInvite = Boolean(invitedEvents?.some((eventId) => ["sakharpuda", "sangeet", "haldi", "shadi"].includes(eventId)));
  const hasReceptionInvite = Boolean(invitedEvents?.includes("reception"));
  const delhiAttending = payload.delhiAttending === "yes" ? "Yes" : payload.delhiAttending === "no" ? "No" : "";
  const receptionAttending = payload.receptionAttending === "yes" ? "Yes" : payload.receptionAttending === "no" ? "No" : "";
  const delhiPartySize = hasDelhiInvite && delhiAttending === "Yes" ? Number(payload.delhiPartySize) : 0;
  const receptionPartySize = hasReceptionInvite && receptionAttending === "Yes" ? Number(payload.receptionPartySize) : 0;
  const idUploadBatchId = asText(payload.idUploadBatchId, 36);
  const idCardsReceived = Number(payload.idCardsReceived) || 0;
  const wishes = asText(payload.wishes, 1200);
  const validPhone = /^[+\d\s().-]+$/.test(phone) && phone.replace(/\D/g, "").length >= 7 && phone.replace(/\D/g, "").length <= 15;

  const validCityResponse = (invited: boolean, answer: string, count: number) =>
    invited
      ? Boolean(answer) && (answer === "No" || (Number.isInteger(count) && count >= 1 && count <= 20))
      : !answer;
  const needsDelhiIds = familySide === "Groom" && hasDelhiInvite && delhiAttending === "Yes";
  const validIdUploads = needsDelhiIds
    ? /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idUploadBatchId) && Number.isInteger(idCardsReceived) && idCardsReceived >= delhiPartySize
    : !idUploadBatchId && idCardsReceived === 0;

  if (
    !fullName || !validPhone || !familySide || !invitedEvents ||
    !validCityResponse(hasDelhiInvite, delhiAttending, delhiPartySize) ||
    !validCityResponse(hasReceptionInvite, receptionAttending, receptionPartySize) ||
    !validIdUploads
  ) {
    return NextResponse.json({ error: "Please complete the required RSVP fields." }, { status: 400 });
  }
  if (!isRsvpSheetsConfigured()) return NextResponse.json({ error: "RSVP storage is not configured yet." }, { status: 503 });

  const result = await postToRsvpSheets({
    fullName,
    phone,
    familySide,
    inviteCode,
    invitedEvents: invitedEvents.join(", "),
    delhiAttending,
    delhiPartySize,
    idUploadBatchId,
    idCardsReceived,
    receptionAttending,
    receptionPartySize,
    wishes,
  });
  if (!result) return NextResponse.json({ error: "The RSVP could not be saved. Please try again." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
