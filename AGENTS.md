<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

- `npm run dev` / `build` / `start` / `lint` — no test runner is configured.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 (`@tailwindcss/postcss`, `@theme inline` in `src/shared/styles/globals.css`) · `next-themes` · Radix · Framer Motion.

Path alias: `@/*` → `./src/*`.

## Architecture

### Middleware (Cloudflare-pinned)

Next.js 16 renamed Middleware → Proxy (`src/proxy.ts`), but `@opennextjs/cloudflare` does **not** support Node-runtime Proxy files, and Next 16's SWC forbids setting `runtime` on `proxy.ts`. Until OpenNext ships adapters-api support (see opennextjs-cloudflare#1213), this project must stay on **`src/middleware.ts`** with `export const runtime = 'experimental-edge'` and an exported `middleware()` function. Do not rename to `proxy.ts`.

`src/middleware.ts` currently has no handlers; `compose(...)` is kept for future ones. Handlers return `NextResponse` to short-circuit or `null` to fall through.

### Authentication

The blog has no sign-in. `/login` and `/admin` redirect to `https://admin.pphat.me`; all writes happen there.

### Upstream API & security

All API reads go through `src/app/api/lib/client.ts`. Every request carries `NEXT_PPHAT_API_KEY`, which the API treats as **the user who issued it** (possibly an admin), so:

- `upstream()` is **GET/HEAD only** and refuses any path that leaves `/v1/api/` after URL normalisation. Never add write methods to it.
- Build dynamic paths with `safeSegment(param)` (rejects `.`/`..`/slashes, percent-encodes). Never interpolate a raw `params.slug`.
- Forward query strings with `pickQuery(searchParams, ALLOWED)`. Always send `status=public` for article lists, and check `published` on article detail (the API does not filter drafts by slug).
- Issue the key from a `user`-role account, not an admin.

Markdown is rendered with `rehype-raw` + `rehype-sanitize` (schema in `src/shared/extension/markdown/renderer.tsx`). Extend the schema rather than removing the sanitizer.

`/api/contact` enforces same-origin, JSON, size limits and a best-effort per-isolate rate limit; HTML in the outgoing email is escaped in `src/shared/libs/email-service.ts`.

### `next.config.ts`

- Security headers (CSP, HSTS, frame/sniff/referrer/permissions) are defined once in `security-headers.mjs`. They are applied by `headers()` here **and** written to `.open-next/assets/_headers` by `scripts/pages-postbuild.mjs`, because Pages serves static assets without running the worker. Update `security-headers.mjs` when adding a new script, font or frame source.
- `images.remotePatterns` whitelists the external image hosts; add new hosts there before using `next/image`.

## Environment

See `.env.example`. `NEXT_PUBLIC_APP_API` (upstream API base) is consumed by `api/lib/client.ts` and `shared/libs/content.ts`. `NEXT_PPHAT_API_KEY` is server-only; never prefix it with `NEXT_PUBLIC_`.
