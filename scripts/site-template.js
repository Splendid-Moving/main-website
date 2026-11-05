// Renders the shared public layout for moving guides and focused service pages.
// Page bodies remain readable Markdown; this file owns layout, navigation and structured data.
import { business, origin, canonical, breadcrumb, escapeHtml as e, jsonLd } from './site-data.js';
import { load } from 'cheerio';

export function pageSchema(page, date) {
    const url = canonical(page.path);
    const item = page.kind === 'article' ? {
        '@type': 'BlogPosting', '@id': `${url}#article`, headline: page.heading,
        description: page.description, datePublished: date, dateModified: date,
        mainEntityOfPage: url, inLanguage: 'en', author: { '@id': business['@id'] },
        publisher: { '@id': business['@id'] }, image: business.image,
    } : {
        '@type': 'Service', '@id': `${url}#service`, name: page.heading,
        description: page.description, url, serviceType: page.category,
        provider: { '@id': business['@id'] }, areaServed: { '@type': 'City', name: 'Los Angeles' },
    };
    return [business, item, breadcrumb(page.path, page.heading, page.kind === 'article')];
}

export function contentCard(page) {
    return `<a class="reading-card" href="/${e(page.path)}"><span class="reading-card__category">${e(page.category)}</span><h3>${e(page.heading)}</h3><p>${e(page.summary)}</p><span class="reading-card__action">${page.kind === 'article' ? 'Read the guide' : 'View moving details'}</span></a>`;
}

const navigation = `<header class="header header--solid content-header" id="header"><nav class="nav container" aria-label="Main navigation"><a href="/" class="nav__logo"><img src="/assets/images/Brand%20Logo.png" alt="Splendid Moving" class="nav__logo-img" width="136" height="64"></a><ul class="nav__menu" id="nav-menu"><li><a class="nav__link" href="/#services">Moving services</a></li><li><a class="nav__link" href="/#pricing">Local rates</a></li><li><a class="nav__link" href="/blog">Moving guides</a></li></ul><div class="nav__actions"><a class="nav__phone" href="tel:+13236452636">(323) 645-2636</a><a class="btn btn--primary nav__cta" href="/quote">Get Free Quote</a></div><button class="nav__toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button></nav></header>`;

const footer = `<footer class="content-footer"><div class="container content-footer__grid"><div><a href="/" class="content-footer__name">Splendid Moving</a><p>550 N Figueroa St<br>Los Angeles, CA 90012</p><a href="tel:+13236452636">(323) 645-2636</a><p>Daily, 6AM–11PM</p></div><nav aria-label="Moving services"><a href="/local-moving">Local moving</a><a href="/long-distance-moving">Long-distance moving</a><a href="/commercial-moving">Commercial moving</a><a href="/packing-services-los-angeles">Packing with your move</a></nav><nav aria-label="Planning and contact"><a href="/apartment-movers-los-angeles">Apartment moves</a><a href="/small-moves-los-angeles">Small moves</a><a href="/blog">Moving guides</a><a href="/quote">Request a quote</a><a href="mailto:info@splendidmoving.com">info@splendidmoving.com</a></nav></div><div class="container content-footer__bottom">© 2026 Splendid Moving. <a href="https://simple-flow.co" target="_blank" rel="noopener">Built by Simple Flow</a></div></footer><div class="mobile-cta"><a class="mobile-cta__btn mobile-cta__btn--call" href="tel:+13236452636">Call Now</a><a class="mobile-cta__btn mobile-cta__btn--quote" href="/quote">Get Quote</a></div>`;

export function documentShell({ title, description, path, body, graph, article = false }) {
    const url = canonical(path);
    return `<!doctype html>
<!-- Public page generated from the content catalog. Edit Markdown and metadata rather than this build output. -->
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${e(url)}"><meta property="og:type" content="${article ? 'article' : 'website'}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(url)}"><meta property="og:image" content="${business.image}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${business.image}"><link rel="icon" href="/assets/images/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles/styles.css"><link rel="stylesheet" href="/styles/content.css"><link rel="alternate" type="application/rss+xml" title="Splendid Moving guides" href="/feed.xml">${jsonLd(graph)}<script defer src="/scripts/analytics.js"></script><script defer src="/_vercel/insights/script.js"></script></head><body class="content-page"><a class="content-skip" href="#main-content">Skip to content</a>${navigation}<main id="main-content">${body}</main>${footer}<script src="/scripts/script.js"></script></body></html>\n`;
}

export function renderContentPage(page, body, catalog, date, wordCount) {
    const isArticle = page.kind === 'article';
    const article = load(body, null, false);
    const outline = [];
    article('h2').each((index, heading) => {
        const id = `section-${index + 1}`;
        article(heading).attr('id', id);
        outline.push(`<li><a href="#${id}">${e(article(heading).text())}</a></li>`);
    });
    body = article.html();
    const displayDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'America/Los_Angeles' }).format(new Date(`${date}T12:00:00-08:00`));
    const related = page.related.map(path => catalog.find(item => item.path === path)).filter(Boolean);
    const crumbs = `<a href="/">Home</a><span aria-hidden="true">/</span>${isArticle ? '<a href="/blog">Moving guides</a><span aria-hidden="true">/</span>' : ''}<span>${e(page.category)}</span>`;
    const aside = `<aside class="article-aside" aria-label="Plan your move"><div class="quote-note"><p class="quote-note__label">Your move, priced from the details</p><h2>Send the addresses and the item list.</h2><p>${e(page.rateNote || 'Local residential rates start at $115 per hour with cash for two movers and a truck. A three-hour minimum applies; your full quote includes the route and applicable fees.')}</p><a href="/quote" class="btn btn--primary">${e(page.cta || 'Get a moving quote')}</a><a class="quote-note__phone" href="tel:+13236452636">(323) 645-2636</a></div><nav class="article-toc" aria-label="On this page"><h2>On this page</h2><ol>${outline.join('')}</ol></nav></aside>`;
    const relatedHtml = related.length ? `<section class="related-reads container" aria-labelledby="related-heading"><h2 id="related-heading">Keep planning your move</h2><div class="reading-grid">${related.map(contentCard).join('')}</div></section>` : '';
    const hero = `<section class="content-hero ${isArticle ? '' : 'content-hero--service'}"><div class="container"><nav class="content-crumbs" aria-label="Breadcrumb">${crumbs}</nav><div class="content-hero__grid"><div><p class="content-category">${e(page.category)}</p><h1>${e(page.heading)}</h1><p class="content-deck">${e(page.summary)}</p>${isArticle ? `<p class="content-byline">By Splendid Moving <span>Published <time datetime="${date}">${displayDate}</time></span><span>${Math.max(1, Math.ceil(wordCount / 210))} minute read</span></p>` : `<a class="btn btn--primary" href="/quote">${e(page.cta)}</a><a class="content-hero__phone" href="tel:+13236452636">Talk through the details: (323) 645-2636</a>`}</div>${isArticle ? '' : '<img class="content-hero__image" src="/assets/images/hero-mobile.webp" alt="A moving truck against the Los Angeles skyline" width="800" height="800" fetchpriority="high">'}</div></div></section>`;
    return documentShell({ title: page.title, description: page.description, path: page.path, article: isArticle, graph: pageSchema(page, date), body: `${hero}<div class="container article-layout"><article class="article-body">${body}</article>${aside}</div>${relatedHtml}<section class="content-end container"><h2>Put your move details in one place.</h2><p>Your addresses, inventory and building access give the team something concrete to quote.</p><a href="/quote" class="btn btn--primary">${e(page.cta || 'Request your moving quote')}</a></section>` });
}

export function renderBlogIndex(pages, date) {
    const articles = pages.filter(page => page.kind === 'article');
    const services = pages.filter(page => page.kind === 'service');
    const graph = [business, { '@type': 'Blog', '@id': `${origin}/blog#blog`, url: `${origin}/blog`, name: 'Los Angeles moving guides', publisher: { '@id': business['@id'] } }, breadcrumb('blog', 'Moving guides')];
    const body = `<section class="content-hero content-hero--index"><div class="container"><nav class="content-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>Moving guides</span></nav><div class="index-intro"><h1>Moving guides for Los Angeles</h1><p class="content-deck">Work out the hourly costs, your building's elevator window and what needs packing. Start with the question holding up your plan.</p></div></div></section><section class="container guide-index" aria-labelledby="guides-heading"><h2 id="guides-heading">Before the boxes reach the truck</h2><div class="reading-grid reading-grid--index">${articles.map(contentCard).join('')}</div></section><section class="container guide-index guide-index--services" aria-labelledby="move-types-heading"><h2 id="move-types-heading">What kind of move are you planning?</h2><div class="reading-grid reading-grid--index">${services.map(contentCard).join('')}</div></section><section class="content-end container"><h2>Have the addresses and item list ready?</h2><p>Send the details for your move. We'll use them to discuss the crew, access and quote.</p><a class="btn btn--primary" href="/quote">Get a moving quote</a></section>`;
    return documentShell({ title: 'Los Angeles Moving Guides & Checklists | Splendid Moving', description: 'Practical LA moving guides from Splendid Moving: local hourly rates, apartment checklists, building paperwork, packing, office planning and moving truck access.', path: 'blog', body, graph });
}
