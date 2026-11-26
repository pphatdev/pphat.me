/**
 * Thin wrapper around `fetch` that targets the upstream pphat API.
 *
 * Base URL: process.env.NEXT_PUBLIC_APP_API (falls back to https://api.pphat.me).
 * NEXT_PUBLIC_* is inlined at build time, and CI passes a missing secret as
 * an empty string, so empty must count as unset (`||`, not `??`).
 *
 * SECURITY: every request carries `NEXT_PPHAT_API_KEY`, which the API treats
 * as the user who issued it. This client is therefore read-only (GET/HEAD)
 * and refuses any path that does not stay under `/v1/api/` after URL
 * normalisation, so a crafted slug such as `../users` cannot reach other
 * endpoints with the server's credentials. Build dynamic paths with
 * `safeSegment()`.
 *
 * Usage:
 *   const slug = safeSegment(params.slug);
 *   if (!slug) return notFound();
 *   const res = await upstream(`/v1/api/articles/${slug}`);
 */

const BASE_URL = (process.env.NEXT_PUBLIC_APP_API || 'https://api.pphat.me').replace(/\/$/, '');
const API_PREFIX = '/v1/api/';
const SAFE_METHODS = new Set(['GET', 'HEAD']);
const MAX_SEGMENT_LENGTH = 200;

export interface UpstreamOptions extends Omit<RequestInit, 'body' | 'method'> {
    method?: 'GET' | 'HEAD';
    next?: { revalidate?: number | false; tags?: string[] };
}

export class UpstreamPathError extends Error {
    constructor(path: string) {
        super(`Refusing upstream request to unsafe path: ${path}`);
        this.name = 'UpstreamPathError';
    }
}

/**
 * Encode a single, already-decoded URL path segment (e.g. a route `slug`
 * param). Returns `null` for values that could escape the intended path:
 * empty, dot segments, or anything containing a slash/backslash/control char.
 */
export function safeSegment(value: string | undefined | null): string | null {
    if (typeof value !== 'string') return null;
    if (value.length === 0 || value.length > MAX_SEGMENT_LENGTH) return null;
    if (value === '.' || value === '..') return null;
    if (/[/\\\u0000-\u001f\u007f]/.test(value)) return null;
    return encodeURIComponent(value);
}

/**
 * Copy only the allowed query parameters (first value each) from an incoming
 * request, so callers cannot smuggle filters such as `status=draft`.
 */
export function pickQuery(source: URLSearchParams, allowed: readonly string[]): URLSearchParams {
    const out = new URLSearchParams();
    for (const key of allowed) {
        const value = source.get(key);
        if (value !== null && value.length <= MAX_SEGMENT_LENGTH) out.set(key, value);
    }
    return out;
}

function resolveUpstreamUrl(path: string): URL {
    const base = new URL(BASE_URL);
    const url = new URL(`${BASE_URL}${path}`);
    const rawPath = path.split(/[?#]/, 1)[0];
    // `new URL` collapses dot segments (including %2e forms); if the resolved
    // pathname differs from what we asked for, the path tried to traverse.
    if (
        url.origin !== base.origin ||
        !rawPath.startsWith(API_PREFIX) ||
        url.pathname !== rawPath
    ) {
        throw new UpstreamPathError(path);
    }
    return url;
}

/**
 * Execute a read-only request against the upstream API and return the raw
 * `Response`. The caller is responsible for reading / forwarding the body.
 */
export async function upstream(
    path: string,
    { headers: extraHeaders, method = 'GET', ...rest }: UpstreamOptions = {}
): Promise<Response> {
    if (!SAFE_METHODS.has(method)) {
        throw new Error(`upstream() is read-only; got ${method}`);
    }
    const url = resolveUpstreamUrl(path);

    if (!process.env.NEXT_PPHAT_API_KEY) {
        console.warn('⚠️ NEXT_PPHAT_API_KEY is missing from environment variables! Did you forget to restart your dev server?');
    }

    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(extraHeaders as Record<string, string>),
        // Set last so a caller cannot override or drop it by accident.
        'x-api-key': process.env.NEXT_PPHAT_API_KEY ?? '',
    };

    return fetch(url, { ...rest, method, headers });
}

/**
 * Build a `Response` that mirrors an upstream response body + status.
 * Only the content type is forwarded; upstream headers (cookies, CORS,
 * hop-by-hop) are dropped.
 */
export async function mirrorResponse(upstreamRes: Response): Promise<Response> {
    const body = await upstreamRes.text();
    const contentType = upstreamRes.headers.get('content-type') ?? 'application/json';

    return new Response(body, {
        status: upstreamRes.status,
        headers: {
            'Content-Type': contentType,
            'X-Content-Type-Options': 'nosniff',
        },
    });
}

/** JSON 404 used when a route param fails `safeSegment()`. */
export function notFoundResponse(): Response {
    return Response.json({ error: 'Not Found' }, { status: 404 });
}

/**
 * Parse a JSON body from an upstream Response and return it together with
 * the status code, so route handlers can inspect it before crafting a reply.
 */
export async function parseUpstream<T = unknown>(
    upstreamRes: Response
): Promise<{ ok: boolean; status: number; data: T }> {
    const text = await upstreamRes.text();
    let data: T;
    try {
        data = JSON.parse(text) as T;
    } catch {
        data = text as unknown as T;
    }
    return { ok: upstreamRes.ok, status: upstreamRes.status, data };
}
