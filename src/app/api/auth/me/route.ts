import { NextRequest, NextResponse } from 'next/server';
import { readerFetch } from '../../lib/reader-client';
import { asReader, clearSessionCookies, setSessionCookies, toReader } from '../../lib/session';

/** Current reader, or `{ user: null }`. Refreshes the session when needed. */
export async function GET(request: NextRequest) {
    const result = await asReader(request, (token) => readerFetch('/v1/api/auth/me', { accessToken: token }));
    const user = result.upstream?.ok ? toReader((await result.upstream.json()) as Record<string, unknown>) : null;
    const res = NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
    if (result.cookies && 'set' in result.cookies) setSessionCookies(res, result.cookies.set);
    if ((result.cookies && 'clear' in result.cookies) || (result.upstream && !result.upstream.ok)) clearSessionCookies(res);
    return res;
}
