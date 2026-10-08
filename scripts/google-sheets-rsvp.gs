const RSVP_SHEET_NAME = "RSVPs";
const RSVP_SPREADSHEET_ID = "1bBFniYzZOxDpxX82u6XZpca2EysV7q4FEaiTN3lS_M4";
const RSVP_HEADERS = [
  "Received at",
  "Name",
  "Phone number",
  "Invite side",
  "Invite code",
  "Invited events",
  "Delhi attending",
  "Delhi party size",
  "ID cards received",
  "Pune Reception attending",
  "Pune Reception party size",
  "Wishes for couple",
  "Publish wish",
];

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");
    const expectedSecret = PropertiesService.getScriptProperties().getProperty("RSVP_SHARED_SECRET");
    if (!expectedSecret || payload.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const spreadsheet = SpreadsheetApp.openById(RSVP_SPREADSHEET_ID);
    const sheet = getRsvpSheet(spreadsheet);

    if (payload.action === "get-wishes") {
      return jsonResponse({ ok: true, wishes: readPublicWishes(sheet) });
    }

    if (payload.action === "upload-id") {
      return jsonResponse({ ok: true, idCardsReceived: uploadIdCard(payload) });
    }

    const idCardCount = verifyIdCardBatch(payload);
    const row = {
      "Received at": new Date(),
      "Name": safeCell(payload.fullName),
      "Phone number": safeCell(payload.phone),
      "Invite side": safeCell(payload.familySide),
      "Invite code": safeCell(payload.inviteCode),
      "Invited events": safeCell(payload.invitedEvents),
      "Delhi attending": safeCell(payload.delhiAttending),
      "Delhi party size": Number(payload.delhiPartySize) || 0,
      "ID cards received": idCardCount,
      "Pune Reception attending": safeCell(payload.receptionAttending),
      "Pune Reception party size": Number(payload.receptionPartySize) || 0,
      "Wishes for couple": safeCell(payload.wishes),
      "Publish wish": payload.publishWish === true && String(payload.wishes || "").trim() ? "Yes" : "No",
    };
    const headers = getHeaders(sheet);
    sheet.appendRow(headers.map((header) => Object.prototype.hasOwnProperty.call(row, header) ? row[header] : ""));
    updateHeadcountSummary(spreadsheet);
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: "Unable to process RSVP" });
  }
}

function authorizeIdStorage() {
  ensureIdFolder();
}

function uploadIdCard(payload) {
  if (payload.familySide !== "Groom" || payload.delhiAttending !== "Yes") {
    throw new Error("ID uploads are only accepted for groom-side Delhi RSVPs.");
  }
  if (!isUuid(payload.batchId) || !isUuid(payload.uploadId)) throw new Error("Invalid upload identifier.");

  const allowedTypes = { "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" };
  const extension = allowedTypes[payload.contentType];
  const bytes = Utilities.base64Decode(payload.base64 || "");
  if (!extension || !bytes.length || bytes.length > 3 * 1024 * 1024) throw new Error("Invalid ID file.");

  const batchFolder = getOrCreateBatchFolder(payload);
  const existing = Drive.Files.list({
    q: `'${batchFolder.id}' in parents and name contains '${payload.uploadId}' and trashed = false`,
    fields: "files(id)",
    pageSize: 10,
  }).files || [];
  if (existing.length) return countBatchFiles(batchFolder.id);

  const currentCount = countBatchFiles(batchFolder.id);
  const blob = Utilities.newBlob(bytes, payload.contentType, `ID ${String(currentCount + 1).padStart(2, "0")} - ${payload.uploadId}.${extension}`);
  Drive.Files.create({
    name: blob.getName(),
    mimeType: payload.contentType,
    parents: [batchFolder.id],
  }, blob, { fields: "id" });
  return countBatchFiles(batchFolder.id);
}

function verifyIdCardBatch(payload) {
  if (payload.familySide !== "Groom" || payload.delhiAttending !== "Yes") {
    if (payload.idUploadBatchId || Number(payload.idCardsReceived)) throw new Error("Unexpected ID upload batch.");
    return 0;
  }
  if (!isUuid(payload.idUploadBatchId)) throw new Error("Missing ID upload batch.");
  const batchFolder = findBatchFolder(payload.idUploadBatchId);
  const count = batchFolder ? countBatchFiles(batchFolder.id) : 0;
  if (count < Number(payload.delhiPartySize) || count !== Number(payload.idCardsReceived)) {
    throw new Error("Please upload an ID for each Delhi guest before submitting.");
  }
  return count;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function getOrCreateBatchFolder(payload) {
  const existing = findBatchFolder(payload.batchId);
  if (existing) return existing;

  const rootId = ensureIdFolder();
  const guestName = String(payload.fullName || "Guest").replace(/[\\/:*?"<>|#%{}~&]/g, " ").trim().slice(0, 60);
  const inviteCode = String(payload.inviteCode || "invite").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 80);
  return Drive.Files.create({
    name: `${inviteCode} - ${guestName} - ${payload.batchId}`,
    mimeType: "application/vnd.google-apps.folder",
    parents: [rootId],
  }, { fields: "id,name" });
}

function findBatchFolder(batchId) {
  const rootId = PropertiesService.getScriptProperties().getProperty("RSVP_ID_UPLOAD_FOLDER_ID");
  if (!rootId) return null;
  const result = Drive.Files.list({
    q: `'${rootId}' in parents and name contains '${batchId}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id,name)",
    pageSize: 10,
  });
  return (result.files || [])[0] || null;
}

function countBatchFiles(folderId) {
  let count = 0;
  let pageToken;
  do {
    const result = Drive.Files.list({
      q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "nextPageToken,files(id)",
      pageSize: 1000,
      pageToken,
    });
    count += (result.files || []).length;
    pageToken = result.nextPageToken;
  } while (pageToken);
  return count;
}

function ensureIdFolder() {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty("RSVP_ID_UPLOAD_FOLDER_ID");
  if (existingId) {
    try {
      return Drive.Files.get(existingId, { fields: "id,mimeType" }).id;
    } catch (error) {
      properties.deleteProperty("RSVP_ID_UPLOAD_FOLDER_ID");
    }
  }
  const folder = Drive.Files.create({
    name: "Kush & Sanya - Private Delhi ID uploads",
    mimeType: "application/vnd.google-apps.folder",
  }, { fields: "id" });
  properties.setProperty("RSVP_ID_UPLOAD_FOLDER_ID", folder.id);
  return folder.id;
}

function updateHeadcountSummary(spreadsheet) {
  let sheet = spreadsheet.getSheetByName("Headcount");
  if (!sheet) sheet = spreadsheet.insertSheet("Headcount");

  sheet.getRange("A1:C3").setValues([
    ["Location", "Households attending", "Guests attending"],
    ["Delhi celebrations", "", ""],
    ["Reception in Pune", "", ""],
  ]);

  const rows = [
    { row: 2, attendance: "Delhi attending", count: "Delhi party size" },
    { row: 3, attendance: "Pune Reception attending", count: "Pune Reception party size" },
  ];
  rows.forEach(({ row, attendance, count }) => {
    const attendanceRange = `INDEX('RSVPs'!A:ZZ,0,MATCH("${attendance}",'RSVPs'!1:1,0))`;
    const countRange = `INDEX('RSVPs'!A:ZZ,0,MATCH("${count}",'RSVPs'!1:1,0))`;
    sheet.getRange(row, 2).setFormula(`=IFERROR(COUNTIF(${attendanceRange},"Yes"),0)`);
    sheet.getRange(row, 3).setFormula(`=IFERROR(SUMIF(${attendanceRange},"Yes",${countRange}),0)`);
  });
  sheet.setFrozenRows(1);
}

function getRsvpSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(RSVP_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(RSVP_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(RSVP_HEADERS);
    sheet.setFrozenRows(1);
  } else {
    let headers = getHeaders(sheet);
    RSVP_HEADERS.forEach((header) => {
      if (!headers.includes(header)) {
        const nextColumn = headers.length + 1;
        sheet.getRange(1, nextColumn).setValue(header);
        headers.push(header);
      }
    });
  }
  return sheet;
}

function getHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  return lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String) : [];
}

function readPublicWishes(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  const wishColumn = headers.indexOf("Wishes for couple");
  const publishColumn = headers.indexOf("Publish wish");
  if (wishColumn < 0 || publishColumn < 0) return [];

  return values.slice(1)
    .filter((row) => String(row[publishColumn]).toLowerCase() === "yes")
    .map((row) => String(row[wishColumn] || "").trim().slice(0, 1200))
    .filter(Boolean)
    .reverse()
    .slice(0, 20);
}

function safeCell(value) {
  const text = String(value || "").trim();
  // Keep guest-entered text from being interpreted as a spreadsheet formula.
  return /^[=+@-]/.test(text) ? "'" + text : text;
}

function jsonResponse(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
