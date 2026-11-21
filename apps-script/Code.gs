/**
 * Wedding website backend (Google Apps Script).
 *
 * Stores RSVPs and messages in the Google Sheet this script is attached to,
 * and saves guest photo uploads to a Google Drive folder.
 * Setup steps are in the repository README.md.
 */

// ID of the Drive folder for guest uploads: the part after /folders/ in its URL.
const UPLOAD_FOLDER_ID = 'PASTE_DRIVE_FOLDER_ID_HERE';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function doGet() {
  return json_({ ok: true, service: 'wedding-backend' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    switch (data.type) {
      case 'rsvp': saveRsvp_(data); break;
      case 'message': saveMessage_(data); break;
      case 'photo': savePhoto_(data); break;
      default: throw new Error('Unknown request type');
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function saveRsvp_(d) {
  const seats = clampInt_(d.seats, 1, 20);
  const attending = d.attending === 'yes' ? 'Yes' : 'No';
  const count = attending === 'Yes' ? clampInt_(d.count, 1, seats) : 0;
  const row = [
    new Date(),
    clean_(d.guestId, 100),
    clean_(d.name, 150),
    seats,
    attending,
    count,
    clean_(d.note, 500),
    clean_(d.lang, 5)
  ];

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = sheet_('RSVPs', ['Updated at', 'Guest ID', 'Name', 'Seats invited', 'Attending', 'Number attending', 'Note', 'Language']);
    // One row per guest: update it if they respond again.
    const last = sheet.getLastRow();
    if (last > 1) {
      const ids = sheet.getRange(2, 2, last - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] === row[1]) {
          sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);
          return;
        }
      }
    }
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

function saveMessage_(d) {
  const name = clean_(d.name, 100);
  const message = clean_(d.message, 2000);
  if (!name || !message) throw new Error('Missing name or message');
  sheet_('Messages', ['Received at', 'Name', 'Message', 'Language'])
    .appendRow([new Date(), name, message, clean_(d.lang, 5)]);
}

function savePhoto_(d) {
  const mime = String(d.mimeType || '');
  if (!/^(image|video)\//.test(mime)) throw new Error('Only photos and videos are accepted');
  const bytes = Utilities.base64Decode(String(d.data || ''));
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw new Error('File is empty or too large');

  const uploader = clean_(d.uploader, 60).replace(/^'/, '') || 'Guest';
  const original = String(d.filename || 'photo').replace(/[\\/:*?"<>|]/g, '_').slice(-100);
  const stamp = Utilities.formatDate(new Date(), 'Asia/Beirut', 'yyyy-MM-dd_HH-mm-ss');
  const filename = stamp + ' - ' + uploader + ' - ' + original;

  const file = DriveApp.getFolderById(UPLOAD_FOLDER_ID)
    .createFile(Utilities.newBlob(bytes, mime, filename));

  sheet_('Uploads', ['Uploaded at', 'Uploader', 'File name', 'Drive link'])
    .appendRow([new Date(), uploader, filename, file.getUrl()]);
}

/* ---------- helpers ---------- */

function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trim, cap length, and stop guest text from being interpreted as a formula.
function clean_(value, maxLen) {
  let s = String(value == null ? '' : value).trim().slice(0, maxLen);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function clampInt_(value, min, max) {
  const n = parseInt(value, 10);
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
