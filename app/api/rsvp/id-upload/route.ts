import { NextResponse } from "next/server";
import { getInvitationEventIds } from "@/lib/invitation-events";
import { isRsvpSheetsConfigured, postToRsvpSheets } from "@/lib/rsvp-sheets";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isExpectedFileType(type: string, bytes: Buffer) {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "application/pdf") return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  return false;
}

export async function POST(request: Request) {
  if (!isRsvpSheetsConfigured()) return NextResponse.json({ error: "ID upload storage is not configured yet." }, { status: 503 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid ID upload." }, { status: 400 });
  }

  const file = form.get("idCard");
  const familySide = form.get("familyOrder") === "groom" ? "Groom" : "";
  const delhiAttending = form.get("delhiAttending") === "yes" ? "Yes" : "";
  const inviteCode = typeof form.get("inviteCode") === "string" ? String(form.get("inviteCode")).trim().slice(0, 80) : "";
  const batchId = typeof form.get("batchId") === "string" ? String(form.get("batchId")) : "";
  const uploadId = typeof form.get("uploadId") === "string" ? String(form.get("uploadId")) : "";
  const fullName = typeof form.get("fullName") === "string" ? String(form.get("fullName")).trim().slice(0, 120) : "";
  const invitedEvents = getInvitationEventIds(inviteCode);
  const hasDelhiInvite = Boolean(invitedEvents?.some((eventId) => ["sakharpuda", "sangeet", "haldi", "shadi"].includes(eventId)));

  if (
    !(file instanceof File) || file.size < 1 || file.size > MAX_FILE_BYTES ||
    familySide !== "Groom" || delhiAttending !== "Yes" || !hasDelhiInvite || !fullName ||
    !UUID_V4.test(batchId) || !UUID_V4.test(uploadId)
  ) {
    return NextResponse.json({ error: "Upload one valid ID file (up to 3 MB) for a groom-side Delhi invitation." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!isExpectedFileType(file.type, bytes)) {
    return NextResponse.json({ error: "Use a genuine JPG, PNG, or PDF ID file." }, { status: 400 });
  }

  const result = await postToRsvpSheets({
    action: "upload-id",
    familySide,
    delhiAttending,
    inviteCode,
    fullName,
    batchId,
    uploadId,
    contentType: file.type,
    fileName: file.name.slice(0, 120),
    base64: bytes.toString("base64"),
  });
  if (!result || typeof result.idCardsReceived !== "number") {
    return NextResponse.json({ error: "This ID could not be uploaded. Please retry the file." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, idCardsReceived: result.idCardsReceived });
}
