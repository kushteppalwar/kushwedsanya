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

export function isRsvpSheetsConfigured() {
  return getSheetsConfig() !== null;
}

export async function postToRsvpSheets(body: Record<string, unknown>) {
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
