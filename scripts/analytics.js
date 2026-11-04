// Loads the Google Analytics tag shared by every public website page.
// Only the production domains send visits, so previews and local checks stay out of reports.
(() => {
    if (!['splendidmoving.com', 'www.splendidmoving.com'].includes(window.location.hostname)) {
        return;
    }

    const measurementId = 'G-SRG0H6LFG5';
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
        window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);

    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(tag);
})();
