import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { securityHeaders } from '../security-headers.mjs';

// Cloudflare Pages serves `.open-next/assets` as the site root and runs
// `_worker.js` at that root as the Pages Functions entry.
//
// Pages' Git integration uploads with its own bundled wrangler 3, and when it
// bundles the OpenNext worker the result crashes at runtime ("Cannot read
// properties of undefined (reading 'require')", 500 on every route). The
// same output uploaded with wrangler 4 works. So bundle the worker here with
// the project's wrangler 4 and ship it as a pre-bundled `_worker.js/`
// directory; `"no_bundle": true` in wrangler.jsonc makes Pages upload it as-is.
//
// This also means the server folders (server-functions, middleware, ...) no
// longer have to be copied into the public assets dir, where they were
// downloadable and, with pnpm, full of symlinks that Pages rejects.
const require = createRequire(import.meta.url);
// wrangler's "exports" only exposes package.json, not bin/, so resolve via it.
const wranglerPkgPath = require.resolve('wrangler/package.json');
const wranglerBin = join(dirname(wranglerPkgPath), require(wranglerPkgPath).bin.wrangler);
const wranglerConfig = JSON.parse(
    // wrangler.jsonc: strip comments before parsing.
    readFileSync('wrangler.jsonc', 'utf8').replace(/^\s*\/\/.*$/gm, ''),
);

const bundleDir = '.open-next/.pages-bundle';
rmSync(bundleDir, { recursive: true, force: true });
mkdirSync(bundleDir, { recursive: true });
// --outdir resolves relative to the config file, so keep both in bundleDir.
writeFileSync(
    `${bundleDir}/wrangler.json`,
    JSON.stringify({
        name: wranglerConfig.name,
        main: '../worker.js',
        compatibility_date: wranglerConfig.compatibility_date,
        compatibility_flags: wranglerConfig.compatibility_flags,
    }),
);
execFileSync(
    process.execPath,
    [wranglerBin, 'deploy', '--dry-run', '--outdir', 'out', '--config', `${bundleDir}/wrangler.json`],
    { stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } },
);

const bundled = readdirSync(`${bundleDir}/out`).filter((f) => !f.endsWith('.map') && f !== 'README.md');
if (!bundled.includes('worker.js')) {
    console.error(`wrangler did not produce ${bundleDir}/out/worker.js (got: ${bundled.join(', ')})`);
    process.exit(1);
}
const workerDir = '.open-next/assets/_worker.js';
rmSync(workerDir, { recursive: true, force: true });
mkdirSync(workerDir, { recursive: true });
for (const file of bundled) {
    copyFileSync(`${bundleDir}/out/${file}`, `${workerDir}/${file === 'worker.js' ? 'index.js' : file}`);
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
