// Builds the existing static pages and Markdown content into a public-only deployment folder.
// Vercel still builds the root api/ functions separately; private notes and monitoring data are never copied.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { load } from 'cheerio';
import { business, origin, published, canonical, breadcrumb, jsonLd, escapeHtml as e } from './site-data.js';
import { contentCard, renderContentPage, renderBlogIndex } from './site-template.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
const catalog = JSON.parse(readFileSync(join(root, 'content/pages.json'), 'utf8'));
const existing = [
    { file: 'index.html', path: '/', name: 'Splendid Moving' },
    { file: 'local-moving.html', path: 'local-moving', name: 'Local moving', service: 'Local moving services' },
    { file: 'long-distance-moving.html', path: 'long-distance-moving', name: 'Long-distance moving', service: 'Long-distance moving services' },
    { file: 'commercial-moving.html', path: 'commercial-moving', name: 'Commercial moving', service: 'Commercial moving services' },
    { file: 'quote.html', path: 'quote', name: 'Request a moving quote' },
];

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const folder of ['assets', 'styles']) cpSync(join(root, folder), join(output, folder), { recursive: true, filter: source => !source.endsWith('hero-bg.png') });
mkdirSync(join(output, 'scripts'), { recursive: true });
for (const file of ['script.js', 'i18n.js', 'analytics.js', 'quote-copy.js', 'quote-photos.js', 'quote-places.js', 'quote-response.js', 'quote-form.js']) cpSync(join(root, 'scripts', file), join(output, 'scripts', file));

function writePage(path, html) {
    const target = join(output, `${path}.html`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, html);
}

for (const page of existing) {
    const $ = load(readFileSync(join(root, page.file), 'utf8'));
    $('script[type="application/ld+json"]').remove();
    const graph = [business, { '@type': 'WebPage', '@id': `${canonical(page.path)}#webpage`, url: canonical(page.path), name: page.name, isPartOf: { '@id': `${origin}/#website` } }];
    if (page.path === '/') graph.push({ '@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'Splendid Moving', publisher: { '@id': business['@id'] } });
    else graph.push(breadcrumb(page.path, page.name));
    if (page.service) graph.push({ '@type': 'Service', name: page.service, url: canonical(page.path), provider: { '@id': business['@id'] }, areaServed: { '@type': 'City', name: 'Los Angeles' } });
    $('head').append(jsonLd(graph));
    $('meta[property="twitter:url"]').attr('content', canonical(page.path));
    $('meta[property="og:image"][content$="hero-bg.png"]').attr('content', business.image);
    $('head').append('<link rel="stylesheet" href="/styles/content.css"><link rel="alternate" type="application/rss+xml" title="Splendid Moving guides" href="/feed.xml">');
    if (page.path === '/') {
        $('head').append('<link rel="preload" as="image" href="/assets/images/hero-mobile.webp" media="(max-width: 767px)"><link rel="preload" as="image" href="/assets/images/hero-desktop.webp" media="(min-width: 768px)">');
        $('#services').before('<section class="about-summary container" id="about" lang="en"><h2>Moving from Los Angeles, with the details agreed in advance.</h2><p>Splendid Moving handles local residential, long-distance and commercial moves connected to the Los Angeles area. Send your addresses, item list and building access details so the team can discuss the crew and quote. You can reach us at <a href="tel:+13236452636">(323) 645-2636</a>, daily from 6AM to 11PM.</p></section>');
    }
    if (page.path !== 'quote') {
        $('#nav-menu').append('<li class="nav__item"><a href="/blog" class="nav__link" data-i18n="nav.guides">Moving guides</a></li>');
        $('.footer__column').first().find('ul').append('<li><a href="/blog" data-i18n="nav.guides">Moving guides</a></li>');
        const related = page.path === 'commercial-moving' ? ['small-office-movers-los-angeles', 'blog/office-moving-checklist-los-angeles', 'blog/moving-building-coi-elevator-reservations'] : page.path === 'long-distance-moving' ? ['blog/long-distance-moving-inventory-checklist', 'packing-services-los-angeles', 'blog/packing-kitchen-for-a-move'] : ['apartment-movers-los-angeles', 'small-moves-los-angeles', 'blog/how-much-do-movers-cost-los-angeles'];
        const cards = related.map(path => catalog.pages.find(item => item.path === path)).map(contentCard).join('');
        $('main').append(`<section class="related-reads container" lang="en"><h2>Work out the details of your move</h2><div class="reading-grid">${cards}</div><p class="related-reads__all"><a href="/blog">Browse all moving guides</a></p></section>`);
    }
    writePage(page.file.replace('.html', ''), $.html());
}

for (const page of catalog.pages) {
    if (!/^(blog\/)?[a-z0-9-]+$/.test(page.path)) throw new Error(`Invalid content path: ${page.path}`);
    const source = resolve(root, 'content', page.body);
    if (!source.startsWith(`${join(root, 'content')}/`)) throw new Error('Content source escapes its folder');
    const markdown = readFileSync(source, 'utf8');
    if (/^#\s/m.test(markdown)) throw new Error(`Article body must not repeat the page H1: ${page.body}`);
    const html = marked.parse(markdown, { gfm: true });
    const wordCount = markdown.split(/\s+/).filter(Boolean).length;
    writePage(page.path, renderContentPage(page, html, catalog.pages, catalog.published, wordCount));
}
writePage('blog', renderBlogIndex(catalog.pages, catalog.published));

const paths = [...existing.map(page => page.path), 'blog', ...catalog.pages.map(page => page.path)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${paths.map(path => {
    const image = catalog.pages.find(page => page.path === path)?.image;
    return `  <url><loc>${e(canonical(path))}</loc><lastmod>${published}</lastmod>${image ? `<image:image><image:loc>${e(`${origin}${image.src}`)}</image:loc></image:image>` : ''}</url>`;
}).join('\n')}\n</urlset>\n`;
writeFileSync(join(output, 'sitemap.xml'), sitemap);
writeFileSync(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
const feed = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Splendid Moving guides</title><link>${origin}/blog</link><description>Practical moving guides for Los Angeles.</description><language>en-us</language>${catalog.pages.filter(page => page.kind === 'article').map(page => `<item><title>${e(page.heading)}</title><link>${canonical(page.path)}</link><guid isPermaLink="true">${canonical(page.path)}</guid><description>${e(page.description)}</description><pubDate>${new Date(`${catalog.published}T00:00:00Z`).toUTCString()}</pubDate></item>`).join('')}</channel></rss>\n`;
writeFileSync(join(output, 'feed.xml'), feed);
console.log(`Built ${paths.length} public pages, sitemap and RSS feed in dist/.`);
