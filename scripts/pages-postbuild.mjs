import { copyFileSync, existsSync, mkdirSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { securityHeaders } from '../security-headers.mjs';

// Cloudflare Pages serves `.open-next/assets` as the site root and treats
// `_worker.js` at that root as the Pages Functions entry. Copy the OpenNext
// worker into position and stage the sibling output dirs it resolves from.
copyFileSync('.open-next/worker.js', '.open-next/assets/_worker.js');

// Copy with symlinks resolved to real files. With pnpm,
// `server-functions/*/node_modules` is a tree of symlinks into
// `node_modules/.pnpm/`, which lives outside the output dir, and Pages rejects
// the upload with "build output directory contains links to files that can't
// be accessed". (fs.cpSync's `dereference` only resolves the top-level source,
// not nested links, so it can't be used here.)
const copyResolved = (src, dest, ancestors = new Set()) => {
    const real = realpathSync(src);
    const stats = statSync(real);
    if (!stats.isDirectory()) {
        copyFileSync(real, dest);
        return;
    }
    if (ancestors.has(real)) return; // symlink cycle
    const next = new Set(ancestors).add(real);
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(real)) {
        copyResolved(`${src}/${entry}`, `${dest}/${entry}`, next);
    }
};

const staged = ['cloudflare', 'middleware', 'server-functions', '.build'];
for (const dir of staged) {
    const src = `.open-next/${dir}`;
    if (existsSync(src)) copyResolved(src, `.open-next/assets/${dir}`);
}

// Fail here with a clear message rather than at Pages' upload validation.
const links = [];
const findLinks = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isSymbolicLink()) links.push(path);
        else if (entry.isDirectory()) findLinks(path);
    }
};
findLinks('.open-next/assets');
if (links.length) {
    console.error(`Symlinks left in .open-next/assets (Pages will reject them):\n  ${links.slice(0, 20).join('\n  ')}`);
    process.exit(1);
}

// Without _routes.json, Pages sends every request through _worker.js, so
// static files (hashed chunks under /_next/static/*, plus everything in
// public/) come back as HTML and 404 in the browser. Exclude the Next chunks
// and every top-level entry in public/ so Pages serves them from assets.
//
// A public/ dir that shares its name with an app route (e.g. public/projects/
// holding sitemap.xml next to the /projects page) must NOT be excluded with a
// wildcard: Pages' `/projects/*` also matches `/projects` itself, so the page
// and every /projects/[slug] would be served as missing static files (404).
// For those dirs, exclude each file individually instead.
const appRoutes = new Set(
    existsSync('src/app')
        ? readdirSync('src/app', { withFileTypes: true })
            .filter((e) => e.isDirectory() && !e.name.startsWith('(') && !e.name.startsWith('_'))
            .map((e) => e.name)
        : [],
);
const listFiles = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? listFiles(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
    );

const exclude = ['/_next/static/*'];
if (existsSync('public')) {
    for (const entry of readdirSync('public')) {
        if (entry.startsWith('.')) continue;
        const isDir = statSync(`public/${entry}`).isDirectory();
        if (!isDir) exclude.push(`/${entry}`);
        else if (!appRoutes.has(entry)) exclude.push(`/${entry}/*`);
        else exclude.push(...listFiles(`public/${entry}`).map((f) => f.slice('public'.length)));
    }
}
// Pages allows at most 100 include + exclude rules in _routes.json.
if (exclude.length + 1 > 100) {
    console.error(`_routes.json would have ${exclude.length + 1} rules (Pages max is 100).`);
    process.exit(1);
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
