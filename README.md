# ourwedding
Jean Paul &amp; Vanessa's wedding - 2027

## Files

- `index.html`, `style.css`, `script.js`: the site
- `i18n.js`: English and Arabic text. Edit both languages here.
- `config.js`: backend URL, RSVP deadline, event date and location
- `wedding.ics`: the "Apple Calendar" event
- `apps-script/Code.gs`: the backend that stores RSVPs, messages and photos

## Backend setup (one time, about 5 minutes)

RSVPs, messages and photo uploads go to your own Google account through a free
Google Apps Script. Guests don't need a Google account.

1. **Create the Drive folder for photos.** In Google Drive, create a folder
   (e.g. "Wedding photos from guests"). Open it and copy the ID from the URL:
   `https://drive.google.com/drive/folders/<THIS_PART>`.
2. **Create the spreadsheet.** Create a new Google Sheet (e.g. "Wedding RSVPs").
3. **Add the script.** In the Sheet, open **Extensions > Apps Script**. Delete
   the sample code and paste the contents of `apps-script/Code.gs`. Replace
   `PASTE_DRIVE_FOLDER_ID_HERE` with the folder ID from step 1, then save.
4. **Deploy it.** Click **Deploy > New deployment**, choose type **Web app**, and set:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy**, approve the permissions (Google warns that the app is
   unverified; choose *Advanced > Go to project*), and copy the **Web app URL**.
   It ends with `/exec`.
5. **Connect the site.** Paste that URL into `appsScriptUrl` in `config.js`,
   then commit and push.

The script creates these tabs on first use:

- **RSVPs**: one row per guest with their latest answer, updated in place if they respond again
- **RSVP history**: every response ever sent, so an earlier answer is never lost
- **Messages**: guest messages
- **Uploads**: who uploaded what, with links to the files in the Drive folder

The backend also protects itself: it refuses photo uploads before
`PHOTOS_OPEN_DATE` (keep it in sync with `photosOpenDate` in `config.js`),
only accepts files whose contents really are photos or videos, and limits how
many uploads and messages it takes per hour (see `LIMITS` in `Code.gs`).

If you change `Code.gs` later, use **Deploy > Manage deployments > Edit >
Version: New version** so the URL stays the same.

## Guest list and invitation codes

The guest list is **not** on the website. It lives in a private **Guests** tab
in the RSVP Google Sheet, with these columns:

| Code | Guest ID | Name | Seats |
|------|----------|------|-------|

- **Code**: the guest's personal invitation code. Their link is
  `https://www.vanessaandjeanpaulelmurr.com/?i=CODE`. Guests can also type the
  code on the site. Don't change a code after it has been sent.
- **Guest ID**: recorded in the RSVPs tab; keep it unique.
- **Name** and **Seats**: shown to the guest. The backend always uses these
  values, so a guest can't change their name or number of seats.

To add a guest, add a row with a new code (letters and digits, at least 6
characters, not already used). Changes take effect immediately, no redeploy
needed.
