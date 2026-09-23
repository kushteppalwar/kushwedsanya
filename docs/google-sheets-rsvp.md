# Connect the wedding RSVP form to Google Sheets

The RSVP form and server endpoint are connected to the Google Sheets web app deployment at `https://script.google.com/macros/s/AKfycbwUwkh_sIOSbfHKN5fDmf4xrxbWEjfrf75cZfhAyRKds5KBz57RTrXRdf0sj87bNGEwlg/exec`.

1. The RSVP destination is already set to the supplied spreadsheet: `1bBFniYzZOxDpxX82u6XZpca2EysV7q4FEaiTN3lS_M4`. The script opens that exact spreadsheet by ID and writes to its `RSVPs` tab. To use another spreadsheet later, replace `RSVP_SPREADSHEET_ID` near the top of [`scripts/google-sheets-rsvp.gs`](../scripts/google-sheets-rsvp.gs) with the part of that sheet's URL between `/d/` and `/edit`.
2. Open the destination Google Sheet and choose **Extensions → Apps Script**. Replace the editor contents with the repository script.
3. In Apps Script, open **Project Settings → Script Properties** and add `RSVP_SHARED_SECRET`. Keep it private. The deployed script and app must use the same value.
4. Choose **Deploy → Manage deployments → Edit → New version** to update the web app. It is deployed to execute as the sheet owner and allow **Anyone** to call the endpoint. The handler checks a private shared secret before reading wishes or saving RSVPs.
5. The deployed URL and matching secret are stored in the ignored `.env.local` file. It must contain:

   ```text
   GOOGLE_SHEETS_RSVP_URL=https://script.google.com/macros/s/AKfycbwUwkh_sIOSbfHKN5fDmf4xrxbWEjfrf75cZfhAyRKds5KBz57RTrXRdf0sj87bNGEwlg/exec
   RSVP_SHEETS_SECRET=the-matching-private-script-property
   ```

6. Restart the Next.js server after changing `.env.local`. New RSVP submissions append to the `RSVPs` tab in that spreadsheet. The script creates the tab and header row if needed, and adds any missing columns while preserving existing responses.

The endpoint keeps the shared secret server-side. RSVPs include the guest's name, phone number, attendance, party size, wish for the couple, and a publish preference. A wish appears publicly on the invitation only when the guest checks the sharing box. The public wishes feed returns the wish text only; it never returns phone numbers, names, or RSVP details.

The web form is wired to `/api/rsvp`, and that route forwards submissions to the Apps Script deployment. The connection was verified through the site endpoint; no test RSVP was added.
