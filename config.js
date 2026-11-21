// Site configuration.
// After deploying apps-script/Code.gs as a Web App (see README.md),
// paste the Web App URL below (it ends with /exec).
window.WEDDING_CONFIG = {
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwa89EA3HT7Ax63KFFdJsy1hFg6VDly-R8vL03PGTS-LHjkUW1YY2XxV-NtD-ppz2469w/exec',

    // Guests can RSVP until the end of this day (Lebanon time).
    rsvpDeadline: '2027-06-01T23:59:59+03:00',

    // The photo upload section stays hidden until this moment (Lebanon time).
    // Add ?photos to the URL to preview it before then.
    photosOpenDate: '2027-07-01T00:00:00+03:00',

    // Maximum size of a single uploaded photo/video, in MB.
    maxUploadMB: 20,

    event: {
        // 5:30 PM Lebanon time (UTC+3 in July) -> 14:30 UTC, ends ~1 AM.
        startUtc: '20270717T143000Z',
        endUtc: '20270717T220000Z',
        location: 'Chateau du Comte, Daraoun, Lebanon',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Chateau%20du%20Comte%20Daraoun',
        siteUrl: 'https://www.vanessaandjeanpaulelmurr.com'
    }
};
