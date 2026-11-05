// Serves the built site locally with Vercel-style clean HTML URLs for visual checks.
// API calls are deliberately unavailable here; use vercel dev for server-side quote development.
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
const root = resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
    try {
        const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/\/$/, '') || '/';
        const file = resolve(root, path === '/' ? 'index.html' : `.${path}${extname(path) ? '' : '.html'}`);
        if (!file.startsWith(`${root}/`) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
        res.end(readFileSync(file));
    } catch { res.writeHead(400); res.end('Bad request'); }
}).listen(8000, '127.0.0.1', () => console.log('Static preview: http://127.0.0.1:8000'));
