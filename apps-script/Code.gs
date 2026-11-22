/**
 * Wedding website backend (Google Apps Script).
 *
 * Stores RSVPs and messages in the Google Sheet this script is attached to,
 * and saves guest photo uploads to a Google Drive folder.
 *
 * The guest list lives in the Sheet's private "Guests" tab (Code, Guest ID,
 * Name, Seats). Guests open their invitation with their personal code, so the
 * list is never published on the website.
 * Setup steps are in the repository README.md.
 */

// ID of the Drive folder for guest uploads: the part after /folders/ in its URL.
const UPLOAD_FOLDER_ID = 'PASTE_DRIVE_FOLDER_ID_HERE';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

// Uploads are refused before this moment (Lebanon time). Keep in sync with
// photosOpenDate in config.js.
const PHOTOS_OPEN_DATE = new Date('2027-07-01T00:00:00+03:00');

// Anti-spam limits, shared by everyone using the site.
const LIMITS = {
  photosPerHour: 400,                       // number of files
  photoBytesPerDay: 4 * 1024 * 1024 * 1024, // 4 GB per day (Drive's free plan is 15 GB)
  messagesPerHour: 60,
  lookupsPerHour: 200                       // invitation code checks (slows down guessing)
};

function doGet() {
  return json_({ ok: true, service: 'wedding-backend' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    switch (data.type) {
      case 'lookup': return json_(Object.assign({ ok: true }, lookup_(data)));
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

const RSVP_HEADERS = ['Updated at', 'Guest ID', 'Name', 'Seats invited', 'Attending', 'Number attending', 'Note', 'Language'];

// Find the guest for an invitation code in the private "Guests" tab.
function findGuest_(code) {
  const c = String(code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (c.length < 4) return null;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Guests');
  if (!sheet) throw new Error('The Guests tab is missing');
  const rows = sheet.getDataRange().getValues();
  // Columns are found by their header, so they can be in any order.
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const col = (...names) => names.map(n => headers.indexOf(n)).find(i => i >= 0);
  const codeCol = col('code');
  const idCol = col('guest id');
  const nameCol = col('invitation name', 'name');
  const arCol = col('invitation name (arabic)', 'name in arabic');
  const seatsCol = col('seats');
  if ([codeCol, idCol, nameCol, seatsCol].some(i => i === undefined)) {
    throw new Error('The Guests tab needs Code, Guest ID, Invitation name and Seats columns');
  }
  for (let i = 1; i < rows.length; i++) {
    const rowCode = String(rows[i][codeCol]).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (rowCode && rowCode === c) {
      return {
        id: String(rows[i][idCol]),
        name: String(rows[i][nameCol]).trim(),
        nameAr: arCol === undefined ? '' : String(rows[i][arCol]).trim(),
        seats: clampInt_(rows[i][seatsCol], 1, 20)
      };
    }
  }
  return null;
}

// Check an invitation code. Returns the guest and their latest answer, if any.
function lookup_(d) {
  takeQuota_('lookups', LIMITS.lookupsPerHour, 0, 0);
  const g = findGuest_(d.code);
  if (!g) throw new Error('unknown-code');
  let previous = null;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RSVPs');
  if (sheet && sheet.getLastRow() > 1) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, RSVP_HEADERS.length).getValues();
    const r = rows.find(row => String(row[1]) === g.id);
    if (r) previous = { attending: r[4] === 'Yes' ? 'yes' : 'no', count: Number(r[5]) || 0, note: String(r[6] || '') };
  }
  return { guest: { name: g.name, nameAr: g.nameAr, seats: g.seats }, previous: previous };
}

function saveRsvp_(d) {
  // Name and seats come from the Guests tab, never from the browser.
  takeQuota_('lookups', LIMITS.lookupsPerHour, 0, 0);
  const g = findGuest_(d.code);
  if (!g) throw new Error('unknown-code');
  const seats = g.seats;
  const attending = d.attending === 'yes' ? 'Yes' : 'No';
  const count = attending === 'Yes' ? clampInt_(d.count, 1, seats) : 0;
  const row = [
    new Date(),
    clean_(g.id, 100),
    clean_(g.name, 150),
    seats,
    attending,
    count,
    clean_(d.note, 500),
    clean_(d.lang, 5)
  ];

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const headers = RSVP_HEADERS;
    // Every response is kept here, so an earlier answer is never lost.
    sheet_('RSVP history', headers).appendRow(row);

    const sheet = sheet_('RSVPs', headers);
    // One row per guest with their latest answer: update it if they respond again.
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
  takeQuota_('messages', LIMITS.messagesPerHour, 0, 0);
  sheet_('Messages', ['Received at', 'Name', 'Message', 'Language'])
    .appendRow([new Date(), name, message, clean_(d.lang, 5)]);
}

function savePhoto_(d) {
  if (new Date() < PHOTOS_OPEN_DATE) throw new Error('Photo uploads are not open yet');
  const bytes = Utilities.base64Decode(String(d.data || ''));
  if (!bytes.length || bytes.length > MAX_UPLOAD_BYTES) throw new Error('File is empty or too large');

  // Check the file's actual contents rather than trusting the type the browser sent.
  const type = detectMediaType_(bytes);
  if (!type) throw new Error('Only photos and videos are accepted');
  takeQuota_('photos', LIMITS.photosPerHour, bytes.length, LIMITS.photoBytesPerDay);

  const uploader = clean_(d.uploader, 60).replace(/^'/, '') || 'Guest';
  // Keep the guest's file name but always end it with the real extension.
  const base = String(d.filename || 'photo').replace(/\.[^.]*$/, '')
    .replace(/[\\/:*?"<>|]/g, '_').slice(-90) || 'photo';
  const original = base + '.' + type.ext;
  const mime = type.mime;
  const stamp = Utilities.formatDate(new Date(), 'Asia/Beirut', 'yyyy-MM-dd_HH-mm-ss');
  const filename = stamp + ' - ' + uploader + ' - ' + original;

  const file = DriveApp.getFolderById(UPLOAD_FOLDER_ID)
    .createFile(Utilities.newBlob(bytes, mime, filename));

  sheet_('Uploads', ['Uploaded at', 'Uploader', 'File name', 'Drive link'])
    .appendRow([new Date(), uploader, filename, file.getUrl()]);
}

/* ---------- helpers ---------- */

// Identify photos and videos from their first bytes. Returns {mime, ext} or null.
function detectMediaType_(bytes) {
  const b = i => (i < bytes.length ? bytes[i] & 0xff : -1);
  const ascii = (start, len) => {
    let s = '';
    for (let i = start; i < start + len; i++) s += String.fromCharCode(b(i));
    return s;
  };

  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (ascii(0, 8) === '\x89PNG\r\n\x1a\n') return { mime: 'image/png', ext: 'png' };
  if (ascii(0, 4) === 'GIF8') return { mime: 'image/gif', ext: 'gif' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  if (b(0) === 0x1a && b(1) === 0x45 && b(2) === 0xdf && b(3) === 0xa3) return { mime: 'video/webm', ext: 'webm' };

  // ISO media files (iPhone HEIC photos, MP4 and MOV videos) have "ftyp" at byte 4.
  if (ascii(4, 4) === 'ftyp') {
    const brand = ascii(8, 4);
    if (/^(heic|heix|hevc|hevx|heim|heis)$/.test(brand)) return { mime: 'image/heic', ext: 'heic' };
    if (/^(mif1|msf1)$/.test(brand)) return { mime: 'image/heif', ext: 'heif' };
    if (brand === 'avif') return { mime: 'image/avif', ext: 'avif' };
    if (brand === 'qt  ') return { mime: 'video/quicktime', ext: 'mov' };
    if (/^M4V/.test(brand)) return { mime: 'video/x-m4v', ext: 'm4v' };
    if (/^(isom|iso\d|mp41|mp42|avc1|dash|3gp\d|3g2\w|MSNV|f4v )$/.test(brand)) return { mime: 'video/mp4', ext: 'mp4' };
  }
  return null;
}

// Count a request against a shared hourly limit (and optional daily byte limit).
// Throws when a limit is reached so floods can't fill the sheet or Drive.
function takeQuota_(kind, perHour, bytes, bytesPerDay) {
  const now = new Date();
  const hourKey = 'quota:' + kind + ':' + Utilities.formatDate(now, 'Asia/Beirut', 'yyyyMMddHH');
  const dayKey = 'quota:' + kind + ':bytes:' + Utilities.formatDate(now, 'Asia/Beirut', 'yyyyMMdd');
  const props = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const count = Number(props.getProperty(hourKey) || 0);
    const used = Number(props.getProperty(dayKey) || 0);
    if (count >= perHour) throw new Error('Too many requests, please try again later');
    if (bytesPerDay && used + bytes > bytesPerDay) throw new Error('Daily upload limit reached, please try again tomorrow');
    if (count === 0) {
      // New hour: forget the counters from earlier hours and days.
      props.getKeys().forEach(k => {
        if (k.indexOf('quota:' + kind + ':') === 0 && k !== hourKey && k !== dayKey) props.deleteProperty(k);
      });
    }
    props.setProperty(hourKey, String(count + 1));
    if (bytesPerDay) props.setProperty(dayKey, String(used + bytes));
  } finally {
    lock.releaseLock();
  }
}

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
