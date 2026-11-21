// First-visit guided tour: a welcome card, then a spotlight on each key part of the page.
const Tour = (() => {
    const STORAGE_KEY = 'tour:v1';

    // Each step highlights the first matching element that is currently visible.
    const STEPS = [
        { targets: ['#musicToggle'], key: 'music' },
        { targets: ['#langToggle'], key: 'lang' },
        { targets: ['#home .date'], key: 'date' },
        { targets: ['#venue .venue-text'], key: 'location' },
        { targets: ['#rsvpSearch', '#rsvpForm', '#rsvpDone', '#rsvpClosed'], key: 'rsvp' },
        { targets: ['#messageForm'], key: 'messages' }
    ];

    let root, spotlight, card, stepLabel, title, text, langBtn, skipBtn, backBtn, nextBtn;
    let index = -1;          // -1 = welcome card
    let target = null;
    let raf = null;
    let lastFocus = null;

    const isVisible = el => el && el.getClientRects().length > 0;
    const findTarget = step => step.targets.map(s => document.querySelector(s)).find(isVisible) || null;

    function build() {
        root = document.createElement('div');
        root.className = 'tour';
        root.hidden = true;
        root.innerHTML = `
            <div class="tour-spotlight"></div>
            <div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourTitle" aria-describedby="tourText">
                <p class="tour-step"></p>
                <h3 id="tourTitle" class="tour-title"></h3>
                <p id="tourText" class="tour-text"></p>
                <button type="button" class="tour-lang"></button>
                <div class="tour-actions">
                    <button type="button" class="tour-skip"></button>
                    <div class="tour-nav">
                        <button type="button" class="tour-back"></button>
                        <button type="button" class="tour-next btn-primary"></button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(root);

        spotlight = root.querySelector('.tour-spotlight');
        card = root.querySelector('.tour-card');
        stepLabel = root.querySelector('.tour-step');
        title = root.querySelector('.tour-title');
        text = root.querySelector('.tour-text');
        langBtn = root.querySelector('.tour-lang');
        skipBtn = root.querySelector('.tour-skip');
        backBtn = root.querySelector('.tour-back');
        nextBtn = root.querySelector('.tour-next');

        nextBtn.addEventListener('click', next);
        backBtn.addEventListener('click', () => go(index - 1, -1));
        skipBtn.addEventListener('click', finish);
        langBtn.addEventListener('click', () => I18N.setLang(I18N.lang === 'en' ? 'ar' : 'en'));
        // Clicks on the dimmed area shouldn't reach the page underneath.
        root.addEventListener('click', e => { if (e.target === root) e.stopPropagation(); });

        document.addEventListener('keydown', onKey);
        document.addEventListener('languagechange-site', () => { if (!root.hidden) render(); });
    }

    function onKey(e) {
        if (!root || root.hidden) return;
        const back = () => { if (index >= 0) go(index - 1, -1); };
        if (e.key === 'Escape') finish();
        else if (e.key === 'ArrowRight') (I18N.lang === 'ar' ? back() : next());
        else if (e.key === 'ArrowLeft') (I18N.lang === 'ar' ? next() : back());
    }

    function next() {
        go(index + 1, 1);
    }

    // dir: +1 when moving forward, -1 when going back (skips steps with nothing visible)
    function go(i, dir = 1) {
        while (i >= 0 && i < STEPS.length && !findTarget(STEPS[i])) i += dir;
        if (i >= STEPS.length) return finish();
        index = Math.max(-1, i);
        target = index >= 0 ? findTarget(STEPS[index]) : null;
        render();
        if (target && getComputedStyle(target).position !== 'fixed' && !target.closest('.navbar')) {
            target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
        nextBtn.focus({ preventScroll: true });
    }

    function render() {
        const welcome = index < 0;
        root.classList.toggle('tour-welcome', welcome);
        spotlight.hidden = welcome;
        langBtn.hidden = !welcome;
        backBtn.hidden = index <= 0;

        if (welcome) {
            stepLabel.textContent = '';
            title.textContent = I18N.t('tour.welcomeTitle');
            text.textContent = I18N.t('tour.welcomeText');
            langBtn.textContent = I18N.t('lang.toggle');
            skipBtn.textContent = I18N.t('tour.skip');
            nextBtn.textContent = I18N.t('tour.start');
        } else {
            const key = STEPS[index].key;
            stepLabel.textContent = I18N.t('tour.step', { i: index + 1, n: STEPS.length });
            title.textContent = I18N.t(`tour.${key}Title`);
            text.textContent = I18N.t(`tour.${key}Text`);
            skipBtn.textContent = I18N.t('tour.skipTour');
            backBtn.textContent = I18N.t('tour.back');
            nextBtn.textContent = I18N.t(index === STEPS.length - 1 ? 'tour.done' : 'tour.next');
        }
        position();
    }

    // Runs every frame while open so the spotlight follows smooth scrolling and resizes.
    function loop() {
        position();
        raf = requestAnimationFrame(loop);
    }

    function position() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 12;
        const cw = card.offsetWidth;
        const ch = card.offsetHeight;

        if (!target) {
            card.style.left = `${Math.max(margin, (vw - cw) / 2)}px`;
            card.style.top = `${Math.max(margin, (vh - ch) / 2)}px`;
            return;
        }

        const r = target.getBoundingClientRect();
        const pad = 8;
        const top = Math.max(r.top - pad, 4);
        const bottom = Math.min(r.bottom + pad, vh - 4);
        const left = Math.max(r.left - pad, 4);
        const right = Math.min(r.right + pad, vw - 4);
        Object.assign(spotlight.style, {
            top: `${top}px`,
            left: `${left}px`,
            width: `${Math.max(0, right - left)}px`,
            height: `${Math.max(0, bottom - top)}px`
        });

        let cardTop;
        if (vh - bottom >= ch + margin * 2) cardTop = bottom + margin;
        else if (top >= ch + margin * 2) cardTop = top - margin - ch;
        else cardTop = vh - ch - margin;
        const cardLeft = Math.min(Math.max(r.left + r.width / 2 - cw / 2, margin), vw - cw - margin);
        card.style.top = `${Math.max(margin, cardTop)}px`;
        card.style.left = `${Math.max(margin, cardLeft)}px`;
    }

    function start() {
        if (!root) build();
        lastFocus = document.activeElement;
        document.querySelector('.navbar')?.classList.remove('nav-open');
        root.hidden = false;
        go(-1);
        cancelAnimationFrame(raf);
        loop();
    }

    function finish() {
        root.hidden = true;
        cancelAnimationFrame(raf);
        target = null;
        try { localStorage.setItem(STORAGE_KEY, 'done'); } catch (e) { /* ignore */ }
        lastFocus?.focus?.({ preventScroll: true });
    }

    function init() {
        document.getElementById('tourStart')?.addEventListener('click', start);
        let seen = false;
        try { seen = localStorage.getItem(STORAGE_KEY) === 'done'; } catch (e) { /* ignore */ }
        if (!seen) setTimeout(start, 800);
    }

    return { init, start };
})();
