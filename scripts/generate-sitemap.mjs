import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Automatically load local .env files if present and not already loaded
for (const envFile of ['.env.local', '.env']) {
    if (existsSync(envFile)) {
        if (typeof process.loadEnvFile === 'function') {
            try { process.loadEnvFile(envFile); } catch {}
        } else {
            try {
                const content = readFileSync(envFile, 'utf8');
                for (const line of content.split('\n')) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) continue;
                    const match = trimmed.replace(/^export\s+/, '').match(/^([^=]+)=(.*)$/);
                    if (match) {
                        const key = match[1].trim();
                        let val = match[2].trim();
                        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.slice(1, -1);
                        }
                        if (!process.env[key]) process.env[key] = val;
                    }
                }
            } catch {}
        }
    }
}

// Canonical production domain. Deliberately not NEXT_PUBLIC_APP_URL: that var
// has been set to other hosts (blog.pphat.me, pphat.pages.app), which put the
// wrong domain into every sitemap URL. Keep in sync with src/shared/seo/site.ts.
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pphat.me').replace(/\/$/, '');
const API_BASE = (process.env.NEXT_PUBLIC_APP_API || 'https://api.pphat.me').replace(/\/$/, '');
const API_KEY = process.env.NEXT_PPHAT_API_KEY || process.env.PPHAT_API_KEY || '';

// Per-route overrides for priority / changefreq. Unlisted routes get defaults.
const ROUTE_META = {
    '/': { changefreq: 'weekly', priority: 1.0 },
    '/posts': { changefreq: 'weekly', priority: 0.9 },
    '/projects': { changefreq: 'monthly', priority: 0.8 },
    '/about': { changefreq: 'monthly', priority: 0.8 },
    '/contact': { changefreq: 'monthly', priority: 0.8 },
};
const DEFAULT_META = { changefreq: 'monthly', priority: 0.5 };

// Route segments that should exclude a page from the sitemap
// (dynamic segments are served by API-driven post/project lists below).
function isDynamicOrGroup(segment) {
    return segment.startsWith('[') || segment.startsWith('(') || segment.startsWith('_') || segment.startsWith('@');
}

// Walk src/app/**/page.{ts,tsx,js,jsx} and derive URL paths.
// Route groups `(x)` collapse away; dynamic `[slug]` pages are skipped
// (they're generated from the API instead).
function discoverStaticRoutes(appDir = join(process.cwd(), 'src/app')) {
    const routes = new Set();
    if (!existsSync(appDir)) return [];

    const walk = (dir, urlParts) => {
        const entries = readdirSync(dir, { withFileTypes: true });
        const hasPage = entries.some(
            (e) => e.isFile() && /^page\.(?:tsx?|jsx?)$/.test(e.name),
        );
        if (hasPage) {
            const url = '/' + urlParts.filter(Boolean).join('/');
            routes.add(url === '//' ? '/' : url.replace(/\/+$/, '') || '/');
        }
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            if (isDynamicOrGroup(entry.name)) {
                if (entry.name.startsWith('(')) {
                    // Route group: recurse without adding a URL segment
                    walk(join(dir, entry.name), urlParts);
                }
                continue;
            }
            walk(join(dir, entry.name), [...urlParts, entry.name]);
        }
    };

    walk(appDir, []);
    return [...routes].sort();
}

function xmlEscape(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function formatDate(value) {
    const d = value ? new Date(value) : new Date();
    return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
}

async function fetchList(path) {
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        });
        if (!res.ok) {
            console.warn(`  ⚠  ${path} → HTTP ${res.status}`);
            return [];
        }
        const json = await res.json();
        return Array.isArray(json?.data) ? json.data : [];
    } catch (err) {
        console.warn(`  ⚠  ${path} → ${err.message}`);
        return [];
    }
}

function urlEntry({ path, lastmod, changefreq, priority }) {
    const p = Math.max(0, Math.min(1, priority)).toFixed(1);
    return [
        '  <url>',
        `    <loc>${xmlEscape(`${BASE_URL}${path}`)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${p}</priority>`,
        '  </url>',
    ].join('\n');
}

function wrap(entries) {
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        entries.join('\n'),
        '</urlset>',
        '',
    ].join('\n');
}

function writeSitemapIndex(paths, today) {
    const items = paths.map((p) => [
        '  <sitemap>',
        `    <loc>${xmlEscape(`${BASE_URL}${p}`)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        '  </sitemap>',
    ].join('\n'));

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        items.join('\n'),
        '</sitemapindex>',
        '',
    ].join('\n');

    writeFileSync(join(process.cwd(), 'public/sitemap-index.xml'), xml, 'utf-8');
}

async function main() {
    const today = new Date().toISOString().slice(0, 10);

    console.log('🗺  Generating sitemaps…');
    console.log(`   base:  ${BASE_URL}`);
    console.log(`   api:   ${API_BASE}`);

    const [articles, projects] = await Promise.all([
        // Explicit filter: an admin-scoped key would otherwise list drafts/private.
        fetchList('/v1/api/articles?status=public'),
        fetchList('/v1/api/projects'),
    ]);

    const postRoutes = articles
        .filter((a) => a.published && a.slug)
        .map((a) => ({
            path: `/posts/${a.slug}`,
            lastmod: formatDate(a.updatedAt || a.createdAt),
            changefreq: 'monthly',
            priority: 0.7,
        }));

    const projectRoutes = projects
        .filter((p) => p.published && p.slug)
        .map((p) => ({
            path: `/projects/${p.slug}`,
            lastmod: formatDate(p.updatedAt || p.createdAt),
            changefreq: 'monthly',
            priority: 0.6,
        }));

    const discovered = discoverStaticRoutes();
    const staticEntries = discovered
        .filter((path) => !path.startsWith('/api'))
        .map((path) => {
            const meta = ROUTE_META[path] ?? DEFAULT_META;
            return { path, lastmod: today, ...meta };
        });

    console.log(`   pages: ${staticEntries.map((r) => r.path).join(', ')}`);

    writeFileSync(
        join(process.cwd(), 'public/sitemap.xml'),
        wrap([...staticEntries, ...postRoutes, ...projectRoutes].map(urlEntry)),
        'utf-8',
    );

    mkdirSync(join(process.cwd(), 'public/blogs'), { recursive: true });
    writeFileSync(
        join(process.cwd(), 'public/blogs/sitemap.xml'),
        wrap([
            { path: '/posts', lastmod: today, changefreq: 'weekly', priority: 1.0 },
            ...postRoutes,
        ].map(urlEntry)),
        'utf-8',
    );

    mkdirSync(join(process.cwd(), 'public/projects'), { recursive: true });
    writeFileSync(
        join(process.cwd(), 'public/projects/sitemap.xml'),
        wrap([
            { path: '/projects', lastmod: today, changefreq: 'monthly', priority: 0.9 },
            ...projectRoutes,
        ].map(urlEntry)),
        'utf-8',
    );

    writeSitemapIndex(
        ['/sitemap.xml', '/blogs/sitemap.xml', '/projects/sitemap.xml'],
        today,
    );

    console.log(`✅  ${staticEntries.length} static + ${postRoutes.length} posts + ${projectRoutes.length} projects → public/sitemap.xml`);
    console.log(`✅  public/blogs/sitemap.xml, public/projects/sitemap.xml, public/sitemap-index.xml`);
}

main().catch((err) => {
    console.error('❌ sitemap generation failed:', err);
    process.exit(1);
});
