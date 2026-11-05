// Validates the built public site for broken local links, metadata and structured data.
// This is an offline check: it never visits external services or submits the quote form.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { load } from 'cheerio';

const root = resolve('dist');
const errors = [];
const walk = folder => readdirSync(folder, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(folder, entry.name)) : [join(folder, entry.name)]);
const files = walk(root).filter(file => file.endsWith('.html'));
const documents = new Map();
for (const file of files) documents.set(file, load(readFileSync(file, 'utf8')));
function publicFile(path) {
    const clean = decodeURIComponent(path).replace(/\/$/, '') || '/';
    return resolve(root, clean === '/' ? 'index.html' : `.${clean}${extname(clean) ? '' : '.html'}`);
}

for (const [file, $] of documents) {
    if (!$('title').text() || !$('meta[name="description"]').attr('content')) errors.push(`${file}: missing title or description`);
    const canonical = $('link[rel="canonical"]').attr('href');
    if (!canonical?.startsWith('https://splendidmoving.com/')) errors.push(`${file}: missing production canonical`);
    $('script[type="application/ld+json"]').each((_, element) => {
        try { JSON.parse($(element).text()); } catch { errors.push(`${file}: invalid JSON-LD`); }
    });
    $('a[href], img[src], link[href], script[src]').each((_, element) => {
        const raw = $(element).attr('href') || $(element).attr('src');
        if (!raw || /^(mailto:|tel:|data:|javascript:)/i.test(raw)) return;
        const url = new URL(raw, canonical);
        if (url.hostname !== 'splendidmoving.com') return;
        if (url.pathname.startsWith('/_vercel/')) return;
        const target = publicFile(url.pathname);
        if (!target.startsWith(root) || !existsSync(target)) { errors.push(`${file}: missing ${raw}`); return; }
        if (url.hash && documents.has(target)) {
            const target$ = documents.get(target);
            const id = decodeURIComponent(url.hash.slice(1));
            if (id && !target$('[id]').toArray().some(node => target$(node).attr('id') === id)) errors.push(`${file}: missing fragment ${raw}`);
        }
    });
}
if (errors.length) throw new Error(errors.join('\n'));
console.log(`Validated ${files.length} public pages: local links, metadata and JSON-LD pass.`);
