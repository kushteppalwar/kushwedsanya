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

The endpoint keeps the shared secret server-side. New RSVPs record the guest's name and phone number, invitation side and code, and the events offered by that link. The form asks for one headcount for the Delhi celebrations and one for the Pune Reception, but only when that location is included in the invitation. A `Headcount` tab summarizes attending households and guests for each location. Wishes and their publish preference remain separate; the public wishes feed returns only wish text, never phone numbers, names, or RSVP details.

Groom-side guests invited to Delhi who accept are asked to upload at least one ID card per Delhi attendee. JPEG, PNG, and PDF files are accepted, with a 3 MB limit per file and no app-level file-count limit. Files upload one at a time with a progress indicator. The Apps Script stores these in the sheet owner's Google Drive, in a private folder named `Kush & Sanya - Private Delhi ID uploads`; each RSVP has a guest-specific subfolder. The `RSVPs` tab records only the number of received ID files, not Drive links. The form does not show an ID upload field on reception-only or bride-side links, and it does not require a consent checkbox. After the sheet confirms the RSVP, guests see a confirmation popup.

To enable Drive uploads, add the **Drive API** advanced service in Apps Script and set the manifest scopes to `https://www.googleapis.com/auth/spreadsheets` and `https://www.googleapis.com/auth/drive.file`. Run `authorizeIdStorage` once from the Apps Script editor, then deploy a new web app version. `drive.file` limits the app to Drive files it creates or uses, instead of granting access to all Drive files. Keep the created folder private and grant access only to the hosts who need to review the IDs. There is no form-level total count limit; Drive storage and Google Apps Script quotas still apply.

Older RSVP rows remain in place, but they do not contain separate Delhi and Pune attendance counts and are not included in the new headcount summary. Follow up with those guests if their counts are still needed.

The web form sends ID files to `/api/rsvp/id-upload` and submits the RSVP to `/api/rsvp` only after those uploads finish. Both routes forward submissions to the Apps Script deployment. After changing the Apps Script source or manifest, deploy a new web app version so the live endpoint uses the updated upload handler.
