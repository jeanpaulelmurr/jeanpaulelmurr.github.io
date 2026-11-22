const CONFIG = window.WEDDING_CONFIG;

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
    initPhotoVisibility();
    initPhotos();
    Tour.init();
});

function initPhotoVisibility() {
    const open = new Date() >= new Date(CONFIG.photosOpenDate)
        || new URLSearchParams(location.search).has('photos');
    document.getElementById('photos').hidden = !open;
    document.getElementById('photosNavItem').hidden = !open;
}

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

function seatsVar(n) {
    return { plural: 'seat', n };
}

// Invitation codes: letters and digits only, case-insensitive.
const cleanCode = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function loadSavedCode() {
    try { return localStorage.getItem('rsvp:code') || ''; } catch (e) { return ''; }
}

function saveCode(code) {
    try {
        if (code) localStorage.setItem('rsvp:code', code);
        else localStorage.removeItem('rsvp:code');
    } catch (e) { /* ignore */ }
}

function initRsvp() {
    const codeForm = document.getElementById('rsvpSearch');
    const codeInput = document.getElementById('codeInput');
    const codeSubmit = document.getElementById('codeSubmit');
    const codeStatus = document.getElementById('codeStatus');
    const form = document.getElementById('rsvpForm');
    const welcome = document.getElementById('rsvpWelcome');
    const reserved = document.getElementById('rsvpReserved');
    const previous = document.getElementById('rsvpPrevious');
    const countWrap = document.getElementById('rsvpCountWrap');
    const countOptions = document.getElementById('rsvpCount');
    const countLabel = document.getElementById('rsvpCountLabel');
    const note = document.getElementById('rsvpNote');
    const submit = document.getElementById('rsvpSubmit');
    const status = document.getElementById('rsvpStatus');
    const done = document.getElementById('rsvpDone');
    const thanks = document.getElementById('rsvpThanks');

    // The invitation the guest opened: { code, name, seats, previous }.
    let selected = null;

    if (new Date() > new Date(CONFIG.rsvpDeadline)) {
        document.getElementById('rsvpClosed').hidden = false;
        codeForm.hidden = true;
        return;
    }

    async function openInvitation(rawCode, { scroll = true, quiet = false } = {}) {
        const code = cleanCode(rawCode);
        if (code.length < 4) {
            if (!quiet) setStatus(codeStatus, 'rsvp.enterCode', {}, 'error');
            return;
        }
        codeSubmit.disabled = true;
        setStatus(codeStatus, 'rsvp.looking', {}, null);
        try {
            const res = await postToBackend({ type: 'lookup', code });
            selected = { code, name: res.guest.name, seats: res.guest.seats, previous: res.previous };
            saveCode(code);
            clearStatus(codeStatus);
            showForm(scroll);
        } catch (err) {
            if (err.message === 'unknown-code') {
                saveCode('');
                if (!quiet) setStatus(codeStatus, 'rsvp.noResults', {}, 'error');
                else clearStatus(codeStatus);
            } else {
                setStatus(codeStatus, errorKey(err), {}, 'error');
            }
        } finally {
            codeSubmit.disabled = false;
        }
    }

    function showForm(scroll) {
        const g = selected;
        codeForm.hidden = true;
        done.hidden = true;
        form.hidden = false;
        form.reset();
        clearStatus(status);

        I18N.set(welcome, 'rsvp.welcome', { name: g.name });
        I18N.set(reserved, 'rsvp.reserved', { seats: seatsVar(g.seats) });

        // One button per possible number of attendees, 1 up to the seats reserved.
        I18N.set(countLabel, 'rsvp.howMany', { max: g.seats });
        countOptions.innerHTML = '';
        for (let i = 1; i <= g.seats; i++) {
            const label = document.createElement('label');
            label.className = 'count-option';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'count';
            radio.value = String(i);
            radio.addEventListener('change', () => clearStatus(status));
            const span = document.createElement('span');
            span.textContent = String(i);
            label.append(radio, span);
            countOptions.appendChild(label);
        }
        countWrap.hidden = true;

        const saved = g.previous;
        previous.hidden = !saved;
        if (saved) {
            form.querySelector(`input[name="attending"][value="${saved.attending}"]`).checked = true;
            if (saved.attending === 'yes') {
                countWrap.hidden = g.seats <= 1;
                const prev = countOptions.querySelector(`input[value="${saved.count}"]`);
                if (prev) prev.checked = true;
            }
            note.value = saved.note || '';
        }
        if (scroll) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function backToCode() {
        selected = null;
        saveCode('');
        form.hidden = true;
        done.hidden = true;
        codeForm.hidden = false;
        codeInput.value = '';
        clearStatus(codeStatus);
        codeInput.focus();
    }

    codeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        openInvitation(codeInput.value);
    });
    codeInput.addEventListener('input', () => clearStatus(codeStatus));

    form.querySelectorAll('input[name="attending"]').forEach(radio => {
        radio.addEventListener('change', () => {
            countWrap.hidden = !(radio.value === 'yes' && radio.checked && selected.seats > 1);
            clearStatus(status);
        });
    });

    document.getElementById('rsvpChange').addEventListener('click', backToCode);
    document.getElementById('rsvpUpdate').addEventListener('click', () => showForm(true));

    // Personal link (?i=CODE) opens the invitation straight away; otherwise
    // reopen the last invitation used on this device.
    const linkCode = new URLSearchParams(location.search).get('i');
    if (linkCode) {
        codeInput.value = cleanCode(linkCode);
        openInvitation(linkCode, { scroll: false });
    } else if (loadSavedCode()) {
        openInvitation(loadSavedCode(), { scroll: false, quiet: true });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selected) return;
        const choice = form.querySelector('input[name="attending"]:checked');
        if (!choice) {
            setStatus(status, 'rsvp.chooseOption', {}, 'error');
            return;
        }
        const attending = choice.value;
        let count = 0;
        if (attending === 'yes') {
            if (selected.seats === 1) {
                count = 1;
            } else {
                const picked = countOptions.querySelector('input[name="count"]:checked');
                if (!picked) {
                    setStatus(status, 'rsvp.chooseCount', { max: selected.seats }, 'error');
                    return;
                }
                count = Number(picked.value);
            }
        }
        const payload = {
            type: 'rsvp',
            code: selected.code,
            attending,
            count,
            note: note.value.trim(),
            lang: I18N.lang
        };

        submit.disabled = true;
        setStatus(status, 'common.sending', {}, null);
        try {
            await postToBackend(payload);
            selected.previous = { attending, count, note: payload.note };
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
            setStatus(status, err.message === 'unknown-code' ? 'rsvp.noResults' : errorKey(err), {}, 'error');
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
