// Loads production analytics and measures phone-link clicks and accepted quote requests.
// Event fields exclude customer details; request IDs stay in this browser solely to prevent duplicate lead counts.
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

    const sourceKey = 'splendid_quote_source';
    const sentKey = 'splendid_measured_quotes';
    const sent = new Set();
    try {
        const saved = JSON.parse(sessionStorage.getItem(sentKey) || '[]');
        if (Array.isArray(saved)) saved.slice(-20).forEach(id => sent.add(id));
    } catch {}
    const cleanPath = value => typeof value === 'string' && /^\/(?:[a-z0-9-]+\/?)*$/.test(value) ? value : '/quote';

    window.splendidAnalytics = Object.freeze({
        quoteSaved({ requestId, quoteType }) {
            if (!requestId || sent.has(requestId)) return;
            let source = '/quote';
            try { source = cleanPath(sessionStorage.getItem(sourceKey)); } catch {}
            window.gtag('event', 'generate_lead', {
                method: 'website_quote',
                quote_type: ['local', 'long_distance', 'office'].includes(quoteType) ? quoteType : 'manual',
                source_page: source,
            });
            sent.add(requestId);
            try { sessionStorage.setItem(sentKey, JSON.stringify([...sent].slice(-20))); } catch {}
        },
    });

    document.addEventListener('click', event => {
        const anchor = event.target.closest?.('a[href]');
        if (!anchor) return;
        const href = anchor.getAttribute('href') || '';
        if (href.startsWith('tel:')) {
            const location = anchor.closest('header') ? 'header' : anchor.closest('.mobile-cta') ? 'mobile_bar' : anchor.closest('footer') ? 'footer' : 'content';
            window.gtag('event', 'phone_click', { link_location: location });
        } else {
            try {
                const target = new URL(anchor.href, window.location.origin);
                if (target.origin === window.location.origin && target.pathname === '/quote') {
                    sessionStorage.setItem(sourceKey, cleanPath(window.location.pathname));
                }
            } catch {}
        }
    });

    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(tag);
})();
