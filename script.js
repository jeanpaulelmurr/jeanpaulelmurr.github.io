const CONFIG = window.WEDDING_CONFIG;
const GUESTS = window.GUESTS || [];

document.addEventListener('DOMContentLoaded', () => {
    // ensure page starts at top (avoid restored scroll)
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    I18N.init();
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
    const backgroundMusic = document.getElementById('backgroundMusic');
    if (!backgroundMusic) return;

    // Most browsers block unmuted autoplay without a user gesture, so if it's
    // blocked we start playback on the visitor's first interaction.
    const startMusic = () => backgroundMusic.play().catch(() => {});
    startMusic();

    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    const resumeOnInteraction = () => {
        if (backgroundMusic.paused) startMusic();
        events.forEach(evt => document.removeEventListener(evt, resumeOnInteraction));
    };
    events.forEach(evt =>
        document.addEventListener(evt, resumeOnInteraction, { once: true, passive: true })
    );
}

/* ---------- Navigation ---------- */

function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navbar = document.querySelector('.navbar');

    navToggle?.addEventListener('click', () => navbar.classList.toggle('nav-open'));

    const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    function smoothScrollTo(targetY, duration) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            window.scrollTo(0, startY + distance * easeInOutCubic(progress));
            if (progress < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }

    document.addEventListener('click', (e) => {
        const link = e.target.closest && e.target.closest('a[href^="#"]');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const topOffset = navbar?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - topOffset - 12;
        smoothScrollTo(targetPosition, 200);
        navbar?.classList.remove('nav-open');
    });
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
                    mimeType: file.type || 'application/octet-stream',
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
