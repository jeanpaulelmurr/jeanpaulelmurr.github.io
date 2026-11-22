// Translations (English / Arabic) and helpers.
//
// Markup usage:
//   data-i18n="key"              -> sets textContent
//   data-i18n-html="key"         -> sets innerHTML (only for trusted strings below)
//   data-i18n-placeholder="key"  -> sets the placeholder attribute
//   data-i18n-vars='{"name":"X"}' -> values substituted into {name}
//     A var of the form {"plural":"seat","n":3} is rendered as "3 seats" / "3 مقاعد".

const TRANSLATIONS = {
    en: {
        'page.title': 'Jean Paul & Vanessa - Wedding 2027',
        'lang.toggle': 'العربية',
        'lang.toggleLabel': 'Switch to Arabic',

        'nav.logo': 'Our Wedding',
        'nav.home': 'Home',
        'nav.story': 'Our Story',
        'nav.details': 'Details',
        'nav.venue': 'Venue',
        'nav.rsvp': 'RSVP',
        'nav.messages': 'Messages',
        'nav.photos': 'Photos',

        'hero.groom': 'Jean Paul El Murr',
        'hero.bride': 'Vanessa Mghames',
        'hero.tagline': 'are getting married',
        'hero.date': '17.07.2027',

        'story.title': 'Our Love Story',
        'story.p1': 'Ten years ago, we met at university, never knowing we’d find our forever in each other. Inseparable ever since, we’ve shared countless memories, endless laughter & a love that only grows stronger.',
        'story.p2': 'Now, our favorite story is becoming our forever',

        'inv.together': 'Together with their families',
        'inv.request': 'request the honor of your presence at the wedding of',
        'inv.when': '17.07.2027<br>at 5:30 PM',
        'inv.venue': 'Chateau du Comte,<br>Daraoun',
        'inv.reception': 'Reception to follow',
        'inv.rsvpBy': 'Kindly respond by 01.06.2027',

        'details.title': 'Wedding Details',
        'details.date': 'Date',
        'details.dateVal': '17.07.2027',
        'details.time': 'Time',
        'details.timeVal': '5:30 PM',
        'details.location': 'Location',
        'details.locationVal': 'Chateau du Comte,<br>Daraoun',
        'details.celebration': 'Celebration',
        'details.celebrationVal': 'Ceremony & Reception',

        'cal.title': 'Save the date',
        'cal.google': 'Google Calendar',
        'cal.apple': 'Apple Calendar',
        'cal.eventTitle': 'Wedding of Jean Paul & Vanessa',
        'cal.eventDetails': 'Ceremony & reception at Chateau du Comte, Daraoun.',

        'venue.title': 'The Venue',
        'venue.name': 'Chateau du Comte',
        'venue.text': 'Join us at Chateau du Comte, a stunning 400-year-old castle nestled in the hills of Daraoun, Harissa, for both our ceremony and celebration. Lovingly restored into a luxurious estate surrounded by gardens and sweeping mountain views, this historic venue will be the perfect setting for us to celebrate our love surrounded by family and friends.',
        'venue.directions': 'Get directions',

        'rsvp.title': 'Confirm Your Attendance',
        'rsvp.subtitle': 'Open the personal link from your invitation, or enter the code it contains.',
        'rsvp.deadline': 'Kindly respond by 01.06.2027',
        'rsvp.closed': 'The RSVP deadline has passed. Please contact us directly if your plans have changed.',
        'rsvp.placeholder': 'Your invitation code',
        'rsvp.find': 'Find my invitation',
        'rsvp.looking': 'Looking up your invitation…',
        'rsvp.searchLabel': 'Invitation code',
        'rsvp.noResults': "We couldn't find that code. Please check it, or reach out to us.",
        'rsvp.enterCode': 'Please enter the code from your invitation.',
        'rsvp.welcome': 'Welcome, {name}!',
        'rsvp.reserved': 'We have reserved {seats} in your honor.',
        'rsvp.previous': 'You have already responded. Feel free to update your answer.',
        'rsvp.question': 'Will you be joining us?',
        'rsvp.accept': 'Joyfully accept',
        'rsvp.decline': 'Regretfully decline',
        'rsvp.acceptCount': 'Joyfully accept. We will be:',
        'rsvp.or': 'or',
        'rsvp.note': 'Anything we should know? (optional)',
        'rsvp.submit': 'Send my response',
        'rsvp.change': 'Not you? Enter another code',
        'rsvp.chooseOption': 'Please choose how many of you will attend, or decline.',
        'rsvp.thanksYes': 'Thank you, {name}! We can’t wait to celebrate with you. {seats} confirmed.',
        'rsvp.thanksNo': 'Thank you for letting us know, {name}. You will be dearly missed!',
        'rsvp.update': 'Change my response',

        'msg.title': 'Leave Us a Message',
        'msg.subtitle': 'Share your wishes, a memory or a piece of advice. We will treasure every word.',
        'msg.name': 'Your name',
        'msg.message': 'Your message',
        'msg.submit': 'Send message',
        'msg.required': 'Please write your name and a message.',
        'msg.thanks': 'Thank you! Your message has reached us with love.',

        'photos.title': 'Share Your Photos',
        'photos.subtitle': 'Captured a beautiful moment? Upload your photos and videos and they will go straight to our wedding album.',
        'photos.name': 'Your name (optional)',
        'photos.choose': 'Choose photos or videos',
        'photos.selected': '{files} selected',
        'photos.upload': 'Upload',
        'photos.none': 'Please choose at least one photo or video.',
        'photos.uploading': 'Uploading {i} of {n}…',
        'photos.done': 'Thank you! {files} uploaded.',
        'photos.tooBig': '{file} is larger than {mb} MB and was skipped.',
        'photos.failed': '{file} could not be uploaded.',

        'tour.open': 'Show the site guide',
        'tour.welcomeTitle': 'Welcome!',
        'tour.welcomeText': 'Thank you for visiting our wedding website. Would you like a quick tour?',
        'tour.start': 'Show me around',
        'tour.skip': 'No thanks',
        'tour.skipTour': 'Skip tour',
        'tour.next': 'Next',
        'tour.back': 'Back',
        'tour.done': 'Done',
        'tour.step': 'Step {i} of {n}',
        'tour.musicTitle': 'Background music',
        'tour.musicText': 'Tap this button anytime to pause or play the music.',
        'tour.langTitle': 'English or Arabic',
        'tour.langText': 'Switch the website between English and Arabic here.',
        'tour.dateTitle': 'The date',
        'tour.dateText': '17.07.2027 at 5:30 PM. You can add it to your calendar in the Details section.',
        'tour.locationTitle': 'The location',
        'tour.locationText': 'Chateau du Comte in Daraoun, Harissa. Tap "Get directions" to open the map.',
        'tour.rsvpTitle': 'Confirm your attendance',
        'tour.rsvpText': 'Your personal invitation opens here, showing how many seats are reserved for you. If it doesn’t, type the code from your invitation message. Please reply by 01.06.2027.',
        'tour.messagesTitle': 'Leave us a message',
        'tour.messagesText': 'Write your wishes for us here. Only the two of us will read them.',

        'common.and': '&',
        'music.play': 'Play music',
        'music.pause': 'Pause music',
        'common.sending': 'Sending…',
        'error.generic': 'Something went wrong. Please try again in a moment.',
        'error.notConfigured': 'This feature isn’t available yet. Please check back soon.',

        'footer.rights': '© 2027 Jean Paul El Murr & Vanessa Mghames. All rights reserved.',
        'footer.love': 'Made with love'
    },

    ar: {
        'page.title': 'جان بول وفانيسا - زفاف 2027',
        'lang.toggle': 'English',
        'lang.toggleLabel': 'التبديل إلى الإنجليزية',

        'nav.logo': 'زفافنا',
        'nav.home': 'الرئيسية',
        'nav.story': 'قصتنا',
        'nav.details': 'التفاصيل',
        'nav.venue': 'المكان',
        'nav.rsvp': 'تأكيد الحضور',
        'nav.messages': 'رسائل',
        'nav.photos': 'الصور',

        'hero.groom': 'جان بول المر',
        'hero.bride': 'فانيسا مغامس',
        'hero.tagline': 'يحتفلان بزفافهما',
        'hero.date': '17.07.2027',

        'story.title': 'قصة حبّنا',
        'story.p1': 'قبل عشر سنوات، التقينا في الجامعة، من دون أن ندري أنّنا سنجد في بعضنا شريك العمر. ومنذ ذلك الحين لم نفترق، فتشاركنا ذكريات لا تُحصى وضحكات لا تنتهي، وحبًّا يزداد قوّةً يومًا بعد يوم.',
        'story.p2': 'واليوم، قصّتنا المفضّلة تصبح قصّة العمر',

        'inv.together': 'مع عائلتيهما',
        'inv.request': 'يتشرّفان بدعوتكم لحضور حفل زفاف',
        'inv.when': '17.07.2027<br>عند الساعة 5:30 مساءً',
        'inv.venue': 'Chateau du Comte،<br>درعون',
        'inv.reception': 'يليه حفل الاستقبال',
        'inv.rsvpBy': 'يُرجى تأكيد الحضور قبل 01.06.2027',

        'details.title': 'تفاصيل الزفاف',
        'details.date': 'التاريخ',
        'details.dateVal': '17.07.2027',
        'details.time': 'الوقت',
        'details.timeVal': '5:30 مساءً',
        'details.location': 'الموقع',
        'details.locationVal': 'Chateau du Comte،<br>درعون',
        'details.celebration': 'الاحتفال',
        'details.celebrationVal': 'الإكليل وحفل الاستقبال',

        'cal.title': 'احفظوا الموعد',
        'cal.google': 'تقويم Google',
        'cal.apple': 'تقويم Apple',
        'cal.eventTitle': 'زفاف جان بول وفانيسا',
        'cal.eventDetails': 'الإكليل وحفل الاستقبال في Chateau du Comte، درعون.',

        'venue.title': 'المكان',
        'venue.name': 'Chateau du Comte',
        'venue.text': 'انضمّوا إلينا في Chateau du Comte، القصر الساحر الذي يعود تاريخه إلى 400 عام، والمتربّع على تلال درعون - حريصا، حيث سيُقام الإكليل والاحتفال. هذا المعلم التاريخي الذي رُمّم بمحبّة ليصبح مقرًّا فاخرًا تحيط به الحدائق وإطلالات الجبال الخلّابة، سيكون المكان المثالي لنحتفل بحبّنا بين العائلة والأصدقاء.',
        'venue.directions': 'الاتجاهات',

        'rsvp.title': 'تأكيد الحضور',
        'rsvp.subtitle': 'افتحوا الرابط الخاص الموجود في دعوتكم، أو أدخلوا الرمز المرفق بها.',
        'rsvp.deadline': 'يُرجى تأكيد الحضور قبل 01.06.2027',
        'rsvp.closed': 'انتهت مهلة تأكيد الحضور. يُرجى التواصل معنا مباشرةً إذا تغيّرت خططكم.',
        'rsvp.placeholder': 'رمز دعوتكم',
        'rsvp.find': 'اعرضوا دعوتي',
        'rsvp.looking': 'جارٍ البحث عن دعوتكم…',
        'rsvp.searchLabel': 'رمز الدعوة',
        'rsvp.noResults': 'لم نجد هذا الرمز. يُرجى التأكّد منه أو التواصل معنا.',
        'rsvp.enterCode': 'يُرجى إدخال الرمز الموجود في دعوتكم.',
        'rsvp.welcome': 'أهلاً وسهلاً، {name}!',
        'rsvp.reserved': 'لقد حجزنا لكم {seats}.',
        'rsvp.previous': 'لقد أرسلتم ردّكم سابقًا. يمكنكم تعديله إن شئتم.',
        'rsvp.question': 'هل ستشاركوننا فرحتنا؟',
        'rsvp.accept': 'نلبّي الدعوة بكل سرور',
        'rsvp.decline': 'نعتذر عن الحضور',
        'rsvp.acceptCount': 'نلبّي الدعوة بكل سرور، وسنكون:',
        'rsvp.or': 'أو',
        'rsvp.note': 'هل من ملاحظة تودّون إعلامنا بها؟ (اختياري)',
        'rsvp.submit': 'إرسال الردّ',
        'rsvp.change': 'لستم أنتم؟ أدخلوا رمزًا آخر',
        'rsvp.chooseOption': 'يُرجى اختيار عدد الحضور أو الاعتذار عن الحضور.',
        'rsvp.thanksYes': 'شكرًا {name}! ننتظر الاحتفال معكم بفارغ الصبر. تمّ تأكيد {seats}.',
        'rsvp.thanksNo': 'شكرًا لإعلامنا، {name}. سنفتقدكم كثيرًا!',
        'rsvp.update': 'تعديل ردّي',

        'msg.title': 'اتركوا لنا رسالة',
        'msg.subtitle': 'شاركونا تمنياتكم أو ذكرى جميلة أو نصيحة. سنحتفظ بكل كلمة.',
        'msg.name': 'اسمكم',
        'msg.message': 'رسالتكم',
        'msg.submit': 'إرسال الرسالة',
        'msg.required': 'يُرجى كتابة اسمكم ورسالتكم.',
        'msg.thanks': 'شكرًا لكم! وصلتنا رسالتكم بكل محبّة.',

        'photos.title': 'شاركونا صوركم',
        'photos.subtitle': 'التقطتم لحظة جميلة؟ حمّلوا صوركم وفيديوهاتكم لتنضمّ مباشرةً إلى ألبوم زفافنا.',
        'photos.name': 'اسمكم (اختياري)',
        'photos.choose': 'اختيار الصور أو الفيديوهات',
        'photos.selected': 'تمّ اختيار {files}',
        'photos.upload': 'تحميل',
        'photos.none': 'يُرجى اختيار صورة أو فيديو واحد على الأقل.',
        'photos.uploading': 'جارٍ تحميل {i} من {n}…',
        'photos.done': 'شكرًا لكم! تمّ تحميل {files}.',
        'photos.tooBig': 'حجم {file} يتجاوز {mb} ميغابايت ولم يتمّ تحميله.',
        'photos.failed': 'تعذّر تحميل {file}.',

        'tour.open': 'عرض دليل الموقع',
        'tour.welcomeTitle': 'أهلاً وسهلاً!',
        'tour.welcomeText': 'شكرًا لزيارتكم موقع زفافنا. هل تودّون القيام بجولة سريعة؟',
        'tour.start': 'لنبدأ الجولة',
        'tour.skip': 'لا، شكرًا',
        'tour.skipTour': 'تخطّي الجولة',
        'tour.next': 'التالي',
        'tour.back': 'السابق',
        'tour.done': 'إنهاء',
        'tour.step': 'الخطوة {i} من {n}',
        'tour.musicTitle': 'الموسيقى',
        'tour.musicText': 'اضغطوا على هذا الزر في أي وقت لإيقاف الموسيقى أو تشغيلها.',
        'tour.langTitle': 'العربية أو الإنجليزية',
        'tour.langText': 'من هنا يمكنكم تغيير لغة الموقع بين العربية والإنجليزية.',
        'tour.dateTitle': 'الموعد',
        'tour.dateText': '17.07.2027 عند الساعة 5:30 مساءً. يمكنكم إضافته إلى تقويمكم في قسم التفاصيل.',
        'tour.locationTitle': 'المكان',
        'tour.locationText': 'Chateau du Comte في درعون - حريصا. اضغطوا على "الاتجاهات" لفتح الخريطة.',
        'tour.rsvpTitle': 'تأكيد الحضور',
        'tour.rsvpText': 'تظهر دعوتكم الخاصة هنا مع عدد المقاعد المحجوزة لكم. إن لم تظهر، أدخلوا الرمز الموجود في رسالة الدعوة. يُرجى الردّ قبل 01.06.2027.',
        'tour.messagesTitle': 'اتركوا لنا رسالة',
        'tour.messagesText': 'اكتبوا لنا تمنياتكم هنا. لن يقرأها أحد سوانا.',

        'common.and': 'و',
        'music.play': 'تشغيل الموسيقى',
        'music.pause': 'إيقاف الموسيقى',
        'common.sending': 'جارٍ الإرسال…',
        'error.generic': 'حدث خطأ ما. يُرجى المحاولة مجددًا بعد قليل.',
        'error.notConfigured': 'هذه الخدمة غير متاحة بعد. يُرجى العودة قريبًا.',

        'footer.rights': '© 2027 جان بول المر وفانيسا مغامس. جميع الحقوق محفوظة.',
        'footer.love': 'صُنع بحبّ'
    }
};

const PLURALS = {
    en: {
        seat: ['seat', 'seats'],
        file: ['file', 'files']
    },
    // Arabic: [one, two, few (3-10), many (11+)]
    ar: {
        seat: ['مقعد واحد', 'مقعدين', 'مقاعد', 'مقعدًا'],
        file: ['ملف واحد', 'ملفين', 'ملفات', 'ملفًا']
    }
};

const I18N = {
    lang: 'en',

    plural(word, n) {
        const forms = PLURALS[this.lang][word];
        if (this.lang === 'ar') {
            if (n === 1) return forms[0];
            if (n === 2) return forms[1];
            if (n >= 3 && n <= 10) return `${n} ${forms[2]}`;
            return `${n} ${forms[3]}`;
        }
        return `${n} ${n === 1 ? forms[0] : forms[1]}`;
    },

    t(key, vars = {}) {
        let str = TRANSLATIONS[this.lang][key] ?? TRANSLATIONS.en[key] ?? key;
        return str.replace(/\{(\w+)\}/g, (_, name) => {
            const v = vars[name];
            if (v && typeof v === 'object' && 'plural' in v) return this.plural(v.plural, v.n);
            // A value given in both languages, e.g. a guest's invitation name.
            if (v && typeof v === 'object' && 'en' in v) return (this.lang === 'ar' && v.ar) || v.en;
            return v ?? '';
        });
    },

    apply(root = document) {
        root.querySelectorAll('[data-i18n]').forEach(el => {
            const vars = el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : {};
            el.textContent = this.t(el.dataset.i18n, vars);
        });
        root.querySelectorAll('[data-i18n-html]').forEach(el => {
            el.innerHTML = this.t(el.dataset.i18nHtml);
        });
        root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = this.t(el.dataset.i18nPlaceholder);
        });
        root.querySelectorAll('[data-i18n-aria]').forEach(el => {
            el.setAttribute('aria-label', this.t(el.dataset.i18nAria));
        });
    },

    // Set a translatable message on an element; it re-translates on language change.
    set(el, key, vars = {}) {
        el.dataset.i18n = key;
        el.dataset.i18nVars = JSON.stringify(vars);
        el.textContent = this.t(key, vars);
    },

    clear(el) {
        delete el.dataset.i18n;
        delete el.dataset.i18nVars;
        el.textContent = '';
    },

    setLang(lang) {
        this.lang = TRANSLATIONS[lang] ? lang : 'en';
        document.documentElement.lang = this.lang;
        document.documentElement.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
        document.title = this.t('page.title');
        try { localStorage.setItem('lang', this.lang); } catch (e) { /* ignore */ }
        this.apply();
        document.dispatchEvent(new CustomEvent('languagechange-site', { detail: this.lang }));
    },

    init() {
        let saved = null;
        try { saved = localStorage.getItem('lang'); } catch (e) { /* ignore */ }
        const urlLang = new URLSearchParams(location.search).get('lang');
        this.setLang(urlLang || saved || 'en');
    }
};
