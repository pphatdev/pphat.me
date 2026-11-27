/**
 * Reader sessions for the blog.
 *
 * Tokens live in HttpOnly cookies scoped to `/api` (page scripts can't read
 * them, pages never send them). Server routes call the API with the access
 * token and transparently refresh once on 401.
 */
import { NextRequest, NextResponse } from 'next/server';
import { readerFetch } from './reader-client';

export const ACCESS_COOKIE = 'pp_at';
export const REFRESH_COOKIE = 'pp_rt';
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;
const ACCESS_FALLBACK_MAX_AGE = 15 * 60;

export interface TokenPair {
    accessToken: string;
    refreshToken?: string | null;
}

/** Public reader profile exposed to the browser (never tokens). */
export interface Reader {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    role: string;
}

const secure = process.env.NODE_ENV === 'production';

/** Seconds until the JWT expires (from its `exp`), falling back to 15 minutes. */
function accessMaxAge(token: string): number {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
        if (payload.exp) return Math.max(60, payload.exp - Math.floor(Date.now() / 1000));
    } catch {
        // fall through
    }
    return ACCESS_FALLBACK_MAX_AGE;
}

export function setSessionCookies(res: NextResponse, tokens: TokenPair): void {
    const base = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/api' };
    res.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...base, maxAge: accessMaxAge(tokens.accessToken) });
    if (tokens.refreshToken) res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...base, maxAge: REFRESH_MAX_AGE });
}

export function clearSessionCookies(res: NextResponse): void {
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
        res.cookies.set(name, '', { httpOnly: true, secure, sameSite: 'lax', path: '/api', maxAge: 0 });
    }
}

export function toReader(user: Record<string, unknown>): Reader {
    return {
        id: String(user.id ?? ''),
        name: (user.name as string) ?? null,
        email: (user.email as string) ?? null,
        avatar: (user.avatar as string) ?? null,
        role: String(user.role ?? 'user'),
    };
}

/**
 * @description Run `call(accessToken)` for the reader in `request`. On a 401,
 * refresh once and retry. Returns the upstream response plus what to do with
 * the cookies (`set` new tokens, `clear` on a dead session, or nothing).
 */
export async function asReader(
    request: NextRequest,
    call: (accessToken: string) => Promise<Response>,
): Promise<{ upstream: Response | null; cookies?: { set: TokenPair } | { clear: true } }> {
    const access = request.cookies.get(ACCESS_COOKIE)?.value;
    const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
    if (!access && !refresh) return { upstream: null };

    if (access) {
        const first = await call(access);
        if (first.status !== 401) return { upstream: first };
    }
    if (!refresh) return { upstream: null, cookies: { clear: true } };

    const refreshed = await readerFetch('/v1/api/auth/refresh', { method: 'POST', body: { refreshToken: refresh } });
    if (!refreshed.ok) return { upstream: null, cookies: { clear: true } };
    const tokens = (await refreshed.json()) as TokenPair;
    if (!tokens.accessToken) return { upstream: null, cookies: { clear: true } };
    return { upstream: await call(tokens.accessToken), cookies: { set: tokens } };
}

/** Build the final response: copy upstream JSON/status and apply cookie changes. */
export async function finish(
    result: { upstream: Response | null; cookies?: { set: TokenPair } | { clear: true } },
    notSignedIn: () => NextResponse = () => NextResponse.json({ error: 'Sign in required' }, { status: 401 }),
): Promise<NextResponse> {
    let res: NextResponse;
    if (!result.upstream) {
        res = notSignedIn();
    } else {
        const text = await result.upstream.text();
        res = new NextResponse(text || null, {
            status: result.upstream.status,
            headers: { 'Content-Type': result.upstream.headers.get('content-type') ?? 'application/json', 'Cache-Control': 'no-store' },
        });
    }
    if (result.cookies && 'set' in result.cookies) setSessionCookies(res, result.cookies.set);
    if (result.cookies && 'clear' in result.cookies) clearSessionCookies(res);
    return res;
}
