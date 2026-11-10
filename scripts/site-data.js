// Shared public identity and metadata helpers for the static publishing build.
// The business record uses existing verified website details and never includes private account data.
export const origin = 'https://splendidmoving.com';
export const published = '2026-11-04';
export const fontLinks = '<link rel="preload" href="/assets/fonts/plus-jakarta-sans-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/styles/fonts.css">';
export const business = {
    '@type': 'MovingCompany',
    '@id': `${origin}/#business`,
    name: 'Splendid Moving',
    url: `${origin}/`,
    telephone: '+1-323-645-2636',
    email: 'info@splendidmoving.com',
    logo: { '@type': 'ImageObject', url: `${origin}/assets/images/Brand%20Logo.png` },
    image: `${origin}/assets/images/hero-desktop.webp`,
    address: { '@type': 'PostalAddress', streetAddress: '550 N Figueroa St', addressLocality: 'Los Angeles', addressRegion: 'CA', postalCode: '90012', addressCountry: 'US' },
    openingHours: 'Mo-Su 06:00-23:00',
    areaServed: { '@type': 'AdministrativeArea', name: 'Los Angeles County' },
    priceRange: '$$',
    sameAs: ['https://www.yelp.com/biz/splendid-moving-los-angeles-3'],
};

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const jsonLd = graph => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>`;
export const canonical = path => `${origin}${path === '/' ? '/' : `/${path}`}`;
export const breadcrumb = (path, title, isArticle = false) => ({
    '@type': 'BreadcrumbList',
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        ...(isArticle ? [{ '@type': 'ListItem', position: 2, name: 'Moving guides', item: `${origin}/blog` }] : []),
        { '@type': 'ListItem', position: isArticle ? 3 : 2, name: title, item: canonical(path) },
    ],
});
