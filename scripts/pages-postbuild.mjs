import { cpSync, copyFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { securityHeaders } from '../security-headers.mjs';

// Cloudflare Pages serves `.open-next/assets` as the site root and treats
// `_worker.js` at that root as the Pages Functions entry. Copy the OpenNext
// worker into position and stage the sibling output dirs it resolves from.
copyFileSync('.open-next/worker.js', '.open-next/assets/_worker.js');

const staged = ['cloudflare', 'middleware', 'server-functions', '.build'];
for (const dir of staged) {
    const src = `.open-next/${dir}`;
    if (existsSync(src)) cpSync(src, `.open-next/assets/${dir}`, { recursive: true });
}

// Without _routes.json, Pages sends every request through _worker.js, so
// static files (hashed chunks under /_next/static/*, plus everything in
// public/) come back as HTML and 404 in the browser. Exclude the Next chunks
// and every top-level entry in public/ so Pages serves them from assets.
const exclude = ['/_next/static/*'];
if (existsSync('public')) {
    for (const entry of readdirSync('public')) {
        if (entry.startsWith('.')) continue;
        const isDir = statSync(`public/${entry}`).isDirectory();
        exclude.push(isDir ? `/${entry}/*` : `/${entry}`);
    }
}
writeFileSync(
    '.open-next/assets/_routes.json',
    JSON.stringify({ version: 1, include: ['/*'], exclude }, null, 2),
);

// Pages serves the excluded static files above without running the worker,
// so next.config headers() never applies to them. Mirror the same security
// headers onto static assets via Pages' `_headers` file.
writeFileSync(
    '.open-next/assets/_headers',
    ['/*', ...securityHeaders().map(({ key, value }) => `  ${key}: ${value}`), ''].join('\n'),
);
