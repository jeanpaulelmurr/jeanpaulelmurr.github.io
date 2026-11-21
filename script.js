const CONFIG = window.WEDDING_CONFIG;
const GUESTS = window.GUESTS || [];

// Scripts load at the end of <body>, so the DOM is ready. Translating right away
// avoids a flash of English for visitors who chose Arabic.
I18N.init();

document.addEventListener('DOMContentLoaded', () => {
    // ensure page starts at top (avoid restored scroll)
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!location.hash) window.scrollTo(0, 0);

    initMusic();
    initNavigation();
    initLanguageToggle();
    initCalendarLinks();
    initRsvp();
    initMessages();
    initPhotos();
});

/* ---------- Music ---------- */

function initMusic() {
    const music = document.getElementById('backgroundMusic');
    const toggle = document.getElementById('musicToggle');
    if (!music || !toggle) return;

    let pausedByUser = false;

    const updateButton = () => {
        const playing = !music.paused;
        toggle.classList.toggle('playing', playing);
        toggle.setAttribute('aria-pressed', String(playing));
        toggle.dataset.i18nAria = playing ? 'music.pause' : 'music.play';
        toggle.setAttribute('aria-label', I18N.t(toggle.dataset.i18nAria));
    };
    music.addEventListener('play', updateButton);
    music.addEventListener('pause', updateButton);

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (music.paused) {
            pausedByUser = false;
            music.play().catch(() => {});
        } else {
            pausedByUser = true;
            music.pause();
        }
    });

    // Browsers block autoplay with sound until the visitor interacts with the
    // page (a tap, click or key press; scrolling doesn't count). Keep trying on
    // each interaction until playback actually starts.
    const events = ['pointerdown', 'touchend', 'keydown'];
    const stopListening = () => events.forEach(evt => document.removeEventListener(evt, tryStart));
    function tryStart() {
        if (pausedByUser || !music.paused) { stopListening(); return; }
        music.play().then(stopListening).catch(() => {});
    }
    events.forEach(evt => document.addEventListener(evt, tryStart, { passive: true }));
    music.play().then(stopListening).catch(() => {});
}

/* ---------- Navigation ---------- */

function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navbar = document.querySelector('.navbar');
    if (!navToggle || !navbar) return;

    const setOpen = (open) => {
        navbar.classList.toggle('nav-open', open);
        navToggle.setAttribute('aria-expanded', String(open));
    };

    navToggle.addEventListener('click', () => setOpen(!navbar.classList.contains('nav-open')));

    // Smooth scrolling and the offset for the sticky navbar are handled in CSS
    // (scroll-behavior + scroll-margin-top); just close the mobile menu.
    navbar.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => setOpen(false)));
}

/* ---------- Language ---------- */

function initLanguageToggle() {
    document.getElementById('langToggle')?.addEventListener('click', () => {
        I18N.setLang(I18N.lang === 'en' ? 'ar' : 'en');
    });
}

/* ---------- Calendar ---------- */

function googleCalendarUrl() {
    const ev = CONFIG.event;
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: I18N.t('cal.eventTitle'),
        dates: `${ev.startUtc}/${ev.endUtc}`,
        location: ev.location,
        details: `${I18N.t('cal.eventDetails')}\n${ev.mapsUrl}\n${ev.siteUrl}`
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function initCalendarLinks() {
    const update = () => {
        const url = googleCalendarUrl();
        document.querySelectorAll('#googleCalLink, [data-calendar-google]').forEach(a => { a.href = url; });
    };
    const directions = document.getElementById('directionsLink');
    if (directions) directions.href = CONFIG.event.mapsUrl;
    update();
    document.addEventListener('languagechange-site', update);
}

/* ---------- Backend ---------- */

async function postToBackend(payload) {
    if (!CONFIG.appsScriptUrl) throw new Error('not-configured');
    // text/plain avoids a CORS preflight, which Apps Script doesn't support.
    const res = await fetch(CONFIG.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'request-failed');
    return data;
}

function errorKey(err) {
    return err && err.message === 'not-configured' ? 'error.notConfigured' : 'error.generic';
}

function setStatus(el, key, vars, type) {
    I18N.set(el, key, vars);
    el.classList.remove('success', 'error');
    if (type) el.classList.add(type);
}

function clearStatus(el) {
    I18N.clear(el);
    el.classList.remove('success', 'error');
}

/* ---------- RSVP ---------- */

const normalize = s => s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const GUEST_INDEX = GUESTS.map(g => {
    const norm = normalize(g.name);
    return { guest: g, norm, tokens: norm.split(' ') };
});

function searchGuests(query) {
    const q = normalize(query);
    if (q.length < 2) return [];
    const qTokens = q.split(' ');
    return GUEST_INDEX
        .map(entry => {
            const allPrefix = qTokens.every(qt => entry.tokens.some(t => t.startsWith(qt)));
            if (allPrefix) return { entry, score: entry.norm.startsWith(q) ? 0 : 1 };
            if (entry.norm.includes(q)) return { entry, score: 2 };
            return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.score - b.score || a.entry.guest.name.localeCompare(b.entry.guest.name))
        .slice(0, 8)
        .map(r => r.entry.guest);
}

function seatsVar(n) {
    return { plural: 'seat', n };
}

function loadSavedRsvp(id) {
    try { return JSON.parse(localStorage.getItem(`rsvp:${id}`)); } catch (e) { return null; }
}

function saveRsvp(id, data) {
    try { localStorage.setItem(`rsvp:${id}`, JSON.stringify(data)); } catch (e) { /* ignore */ }
}

function initRsvp() {
    const input = document.getElementById('guestInput');
    const results = document.getElementById('guestResults');
    const noResults = document.getElementById('guestNoResults');
    const searchBox = document.getElementById('rsvpSearch');
    const form = document.getElementById('rsvpForm');
    const welcome = document.getElementById('rsvpWelcome');
    const reserved = document.getElementById('rsvpReserved');
    const previous = document.getElementById('rsvpPrevious');
    const countWrap = document.getElementById('rsvpCountWrap');
    const countSelect = document.getElementById('rsvpCount');
    const note = document.getElementById('rsvpNote');
    const submit = document.getElementById('rsvpSubmit');
    const status = document.getElementById('rsvpStatus');
    const done = document.getElementById('rsvpDone');
    const thanks = document.getElementById('rsvpThanks');

    let selected = null;

    if (new Date() > new Date(CONFIG.rsvpDeadline)) {
        document.getElementById('rsvpClosed').hidden = false;
        searchBox.hidden = true;
        return;
    }

    function renderResults() {
        const query = input.value;
        const matches = searchGuests(query);
        results.innerHTML = '';
        matches.forEach(g => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'guest-option';
            const name = document.createElement('span');
            name.className = 'guest-option-name';
            name.textContent = g.name;
            const seats = document.createElement('span');
            seats.className = 'guest-option-seats';
            seats.textContent = I18N.plural('seat', g.seats);
            btn.append(name, seats);
            btn.addEventListener('click', () => selectGuest(g));
            li.appendChild(btn);
            results.appendChild(li);
        });
        noResults.hidden = !(normalize(query).length >= 2 && matches.length === 0);
    }

    function selectGuest(g) {
        selected = g;
        searchBox.hidden = true;
        done.hidden = true;
        form.hidden = false;
        form.reset();
        clearStatus(status);

        I18N.set(welcome, 'rsvp.welcome', { name: g.name });
        I18N.set(reserved, 'rsvp.reserved', { seats: seatsVar(g.seats) });

        countSelect.innerHTML = '';
        for (let i = g.seats; i >= 1; i--) {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = String(i);
            countSelect.appendChild(opt);
        }
        countWrap.hidden = true;

        const saved = loadSavedRsvp(g.id);
        previous.hidden = !saved;
        if (saved) {
            form.querySelector(`input[name="attending"][value="${saved.attending}"]`).checked = true;
            if (saved.attending === 'yes') {
                countWrap.hidden = g.seats <= 1;
                countSelect.value = String(saved.count);
            }
            note.value = saved.note || '';
        }
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function backToSearch() {
        selected = null;
        form.hidden = true;
        done.hidden = true;
        searchBox.hidden = false;
        input.value = '';
        renderResults();
        input.focus();
    }

    input.addEventListener('input', renderResults);
    document.addEventListener('languagechange-site', () => { if (!searchBox.hidden) renderResults(); });

    form.querySelectorAll('input[name="attending"]').forEach(radio => {
        radio.addEventListener('change', () => {
            countWrap.hidden = !(radio.value === 'yes' && radio.checked && selected.seats > 1);
            clearStatus(status);
        });
    });

    document.getElementById('rsvpChange').addEventListener('click', backToSearch);
    document.getElementById('rsvpUpdate').addEventListener('click', () => selectGuest(selected));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selected) return;
        const choice = form.querySelector('input[name="attending"]:checked');
        if (!choice) {
            setStatus(status, 'rsvp.chooseOption', {}, 'error');
            return;
        }
        const attending = choice.value;
        const count = attending === 'yes' ? Number(countSelect.value || 1) : 0;
        const payload = {
            type: 'rsvp',
            guestId: selected.id,
            name: selected.name,
            seats: selected.seats,
            attending,
            count,
            note: note.value.trim(),
            lang: I18N.lang
        };

        submit.disabled = true;
        setStatus(status, 'common.sending', {}, null);
        try {
            await postToBackend(payload);
            saveRsvp(selected.id, { attending, count, note: payload.note });
            clearStatus(status);
            form.hidden = true;
            done.hidden = false;
            if (attending === 'yes') {
                I18N.set(thanks, 'rsvp.thanksYes', { name: selected.name, seats: seatsVar(count) });
            } else {
                I18N.set(thanks, 'rsvp.thanksNo', { name: selected.name });
            }
            document.getElementById('rsvpDoneCalendar').hidden = attending !== 'yes';
        } catch (err) {
            setStatus(status, errorKey(err), {}, 'error');
        } finally {
            submit.disabled = false;
        }
    });
}

/* ---------- Messages ---------- */

function initMessages() {
    const form = document.getElementById('messageForm');
    const name = document.getElementById('msgName');
    const text = document.getElementById('msgText');
    const submit = document.getElementById('msgSubmit');
    const status = document.getElementById('msgStatus');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!name.value.trim() || !text.value.trim()) {
            setStatus(status, 'msg.required', {}, 'error');
            return;
        }
        submit.disabled = true;
        setStatus(status, 'common.sending', {}, null);
        try {
            await postToBackend({
                type: 'message',
                name: name.value.trim(),
                message: text.value.trim(),
                lang: I18N.lang
            });
            form.reset();
            setStatus(status, 'msg.thanks', {}, 'success');
        } catch (err) {
            setStatus(status, errorKey(err), {}, 'error');
        } finally {
            submit.disabled = false;
        }
    });
}

/* ---------- Photos ---------- */

// Some browsers leave file.type empty (e.g. iPhone HEIC photos on desktop).
const EXTENSION_TYPES = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
    mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v', webm: 'video/webm'
};

function fileMimeType(file) {
    if (file.type) return file.type;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return EXTENSION_TYPES[ext] || 'application/octet-stream';
}

function readAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function initPhotos() {
    const form = document.getElementById('photoForm');
    const nameInput = document.getElementById('photoName');
    const filesInput = document.getElementById('photoFiles');
    const selectedLabel = document.getElementById('photoSelected');
    const submit = document.getElementById('photoSubmit');
    const status = document.getElementById('photoStatus');
    const errors = document.getElementById('photoErrors');
    const progress = document.getElementById('photoProgress');
    const bar = document.getElementById('photoProgressBar');
    const maxBytes = CONFIG.maxUploadMB * 1024 * 1024;

    filesInput.addEventListener('change', () => {
        const n = filesInput.files.length;
        if (n) I18N.set(selectedLabel, 'photos.selected', { files: { plural: 'file', n } });
        else I18N.clear(selectedLabel);
        clearStatus(status);
        errors.innerHTML = '';
    });

    function addError(key, vars) {
        const li = document.createElement('li');
        I18N.set(li, key, vars);
        errors.appendChild(li);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const files = Array.from(filesInput.files);
        errors.innerHTML = '';
        if (!files.length) {
            setStatus(status, 'photos.none', {}, 'error');
            return;
        }
        if (!CONFIG.appsScriptUrl) {
            setStatus(status, 'error.notConfigured', {}, 'error');
            return;
        }

        const toUpload = files.filter(f => {
            if (f.size > maxBytes) {
                addError('photos.tooBig', { file: f.name, mb: CONFIG.maxUploadMB });
                return false;
            }
            return true;
        });

        submit.disabled = true;
        filesInput.disabled = true;
        progress.hidden = false;
        bar.style.width = '0%';
        let uploaded = 0;

        for (let i = 0; i < toUpload.length; i++) {
            const file = toUpload[i];
            setStatus(status, 'photos.uploading', { i: i + 1, n: toUpload.length }, null);
            try {
                const data = await readAsBase64(file);
                await postToBackend({
                    type: 'photo',
                    uploader: nameInput.value.trim(),
                    filename: file.name,
                    mimeType: fileMimeType(file),
                    data
                });
                uploaded++;
            } catch (err) {
                if (err.message === 'not-configured') break;
                addError('photos.failed', { file: file.name });
            }
            bar.style.width = `${Math.round(((i + 1) / toUpload.length) * 100)}%`;
        }

        submit.disabled = false;
        filesInput.disabled = false;
        progress.hidden = true;
        if (uploaded > 0) {
            setStatus(status, 'photos.done', { files: { plural: 'file', n: uploaded } }, 'success');
            filesInput.value = '';
            I18N.clear(selectedLabel);
        } else if (toUpload.length) {
            setStatus(status, 'error.generic', {}, 'error');
        } else {
            clearStatus(status);
        }
    });
}
