// Snapshot public/assets/brands/** into a JSON module at build time.
//
// The site runs on Cloudflare Workers, which have no filesystem: fs.readdirSync
// / readFileSync throw at request time, so the tech-stack and experience icons
// rendered empty in production. Pages import this generated file instead.
//
// Output: src/shared/data/brands.generated.json
//   { "files": ["stacks/react.svg", ...], "svg": { "stacks/react.svg": "<svg ...>" } }
//
// Runs automatically before `build` and `dev` (see package.json).

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const ROOT = 'public/assets/brands';
const OUT = 'src/shared/data/brands.generated.json';

const files = [];
const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(full);
        else if (/\.(svg|png|jpe?g)$/i.test(entry.name)) files.push(full.slice(ROOT.length + 1));
    }
};
walk(ROOT);
files.sort();

const svg = {};
for (const file of files) {
    if (file.toLowerCase().endsWith('.svg')) svg[file] = readFileSync(`${ROOT}/${file}`, 'utf8');
}

const json = JSON.stringify({ files, svg }, null, 2) + '\n';
let previous = '';
try { previous = readFileSync(OUT, 'utf8'); } catch {}
if (json !== previous) writeFileSync(OUT, json);
console.log(`🎨  ${files.length} brand assets (${Object.keys(svg).length} svg) → ${OUT}`);
