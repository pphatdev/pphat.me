import { NextResponse } from 'next/server';
import { readerFetch } from './reader-client';
import { setSessionCookies, toReader, type TokenPair } from './session';

/**
 * @description Turn API tokens into a signed-in blog session: confirm them with
 * `/auth/me` (so forged tokens are rejected), set the HttpOnly cookies, and
 * return only the public reader profile.
 */
export async function signInResponse(tokens: Partial<TokenPair> | null): Promise<NextResponse> {
    if (!tokens?.accessToken || typeof tokens.accessToken !== 'string') {
        return NextResponse.json({ error: 'Sign-in failed' }, { status: 401 });
    }
    const me = await readerFetch('/v1/api/auth/me', { accessToken: tokens.accessToken });
    if (!me.ok) return NextResponse.json({ error: 'Sign-in failed' }, { status: 401 });
    const res = NextResponse.json(
        { user: toReader((await me.json()) as Record<string, unknown>) },
        { headers: { 'Cache-Control': 'no-store' } },
    );
    setSessionCookies(res, {
        accessToken: tokens.accessToken,
        refreshToken: typeof tokens.refreshToken === 'string' ? tokens.refreshToken : null,
    });
    return res;
}

/** Relay an upstream error's status and message without leaking internals. */
export async function relayError(upstream: Response, fallback: string): Promise<NextResponse> {
    const body = (await upstream.json().catch(() => ({}))) as { error?: unknown; message?: unknown };
    const message = typeof body.error === 'string' ? body.error : typeof body.message === 'string' ? body.message : fallback;
    return NextResponse.json({ error: message }, { status: upstream.status });
}
