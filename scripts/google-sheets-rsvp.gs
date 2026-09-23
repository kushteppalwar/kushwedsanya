const RSVP_SHEET_NAME = "RSVPs";
const RSVP_SPREADSHEET_ID = "1bBFniYzZOxDpxX82u6XZpca2EysV7q4FEaiTN3lS_M4";
const RSVP_HEADERS = [
  "Received at",
  "Name",
  "Phone number",
  "Attending",
  "Party size",
  "Accompanying guests",
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

    const row = {
      "Received at": new Date(),
      "Name": safeCell(payload.fullName),
      "Phone number": safeCell(payload.phone),
      "Attending": safeCell(payload.attending),
      "Party size": Number(payload.partySize),
      "Accompanying guests": safeCell(payload.guestNames),
      "Wishes for couple": safeCell(payload.wishes),
      "Publish wish": payload.publishWish === true && String(payload.wishes || "").trim() ? "Yes" : "No",
    };
    const headers = getHeaders(sheet);
    sheet.appendRow(headers.map((header) => Object.prototype.hasOwnProperty.call(row, header) ? row[header] : ""));
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: "Unable to process RSVP" });
  }
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
