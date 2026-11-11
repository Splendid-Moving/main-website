// Checks the public SEO publishing contract rather than private template details.
// All checks are local and must not send analytics, API requests, or customer messages.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { load } from 'cheerio';

test('the SEO build publishes useful pages, linked metadata and a complete sitemap', () => {
    execFileSync(process.execPath, ['scripts/build-site.js'], { stdio: 'pipe' });
    const catalog = JSON.parse(readFileSync('content/pages.json', 'utf8'));
    assert.equal(catalog.pages.filter(page => page.kind === 'article').length, 8);
    assert.equal(catalog.pages.filter(page => page.kind === 'service').length, 4);
    const sitemap = load(readFileSync('dist/sitemap.xml', 'utf8'), { xmlMode: true });
    const urls = sitemap('loc').map((_, node) => sitemap(node).text()).get();
    assert.equal(urls.length, 18);
    assert.equal(new Set(urls).size, urls.length);
    const titles = new Set();
    const descriptions = new Set();
    for (const page of catalog.pages) {
        const html = readFileSync(`dist/${page.path}.html`, 'utf8');
        const $ = load(html);
        assert.equal($('main h1').length, 1, page.path);
        assert.equal($('link[rel="canonical"]').attr('href'), `https://splendidmoving.com/${page.path}`);
        assert.ok(urls.includes(`https://splendidmoving.com/${page.path}`));
        assert.ok(!titles.has($('title').text()), `duplicate title: ${page.path}`);
        titles.add($('title').text());
        const description = $('meta[name="description"]').attr('content');
        assert.ok(description && !descriptions.has(description), page.path);
        descriptions.add(description);
        assert.ok($('main a[href="/quote"]').length, page.path);
        const types = [];
        $('script[type="application/ld+json"]').each((_, node) => {
            const data = JSON.parse($(node).text());
            types.push(...(data['@graph'] || [data]).map(item => item['@type']));
        });
        assert.ok(types.includes('BreadcrumbList'), page.path);
        assert.ok(types.includes(page.kind === 'article' ? 'BlogPosting' : 'Service'), page.path);
    }
    assert.match(readFileSync('dist/feed.xml', 'utf8'), /<rss/);
    assert.ok(!existsSync('dist/.env'));
    assert.ok(!existsSync('dist/seo'));
    assert.ok(!existsSync('dist/content'));
    assert.ok(!existsSync('dist/tests'));
});

test('published internal links and anchors resolve to actual public pages', () => {
    execFileSync(process.execPath, ['scripts/validate-site.js'], { stdio: 'pipe' });
});

test('guides expose their related parent services as navigation links', () => {
    for (const [guide, parent] of [['office-moving-checklist-los-angeles', 'commercial-moving'], ['long-distance-moving-inventory-checklist', 'long-distance-moving']]) {
        const $ = load(readFileSync(`dist/blog/${guide}.html`, 'utf8'));
        assert.ok($(`.related-reads a[href="/${parent}"]`).length, `${guide} must expose its related ${parent} service`);
    }
});

test('business markup has no self-serving review scores and hero payloads stay small', () => {
    const $ = load(readFileSync('dist/index.html', 'utf8'));
    const nodes = [];
    $('script[type="application/ld+json"]').each((_, element) => {
        const data = JSON.parse($(element).text());
        nodes.push(...(data['@graph'] || [data]));
    });
    const business = nodes.find(node => node['@type'] === 'MovingCompany');
    assert.ok(business);
    assert.equal(business.aggregateRating, undefined);
    assert.equal(business.review, undefined);
    assert.equal(business['@id'], 'https://splendidmoving.com/#business');
    for (const file of ['hero-desktop.webp', 'hero-mobile.webp']) {
        assert.ok(readFileSync(`dist/assets/images/${file}`).length < 500000, file);
    }
    assert.match(readFileSync('dist/styles/styles.css', 'utf8'), /hero-mobile\.webp/);
});

test('legacy page redirects retain relevant replacements', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
    const expected = {
        '/our-services': '/#services',
        '/contacts': '/quote',
        '/residental-moving': '/local-moving',
        '/about-company': '/#about',
    };
    for (const [source, destination] of Object.entries(expected)) {
        assert.ok(config.redirects.some(rule => rule.source === source && rule.destination === destination && rule.permanent), source);
    }
});


test('service question panels have one visible heading and a valid section label', () => {
    for (const slug of ['apartment-movers-los-angeles', 'small-office-movers-los-angeles']) {
        const $ = load(readFileSync(`dist/${slug}.html`, 'utf8'));
        const panel = $('.guide-panel--questions');
        const label = panel.attr('aria-labelledby');
        assert.equal(panel.length, 1);
        assert.ok(label && $(`[id="${label}"]`).length === 1, `${slug} needs a unique question heading`);
        const title = $(`[id="${label}"]`).text();
        assert.equal($('h2').filter((_, heading) => $(heading).text() === title).length, 1, `${slug} repeats its question heading`);
        assert.ok(!panel.children('h2').length, `${slug} must use the existing section heading`);
    }
});
