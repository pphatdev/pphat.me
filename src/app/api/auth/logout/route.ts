import { NextRequest, NextResponse } from 'next/server';
import { guardWrite } from '../../lib/guard';
import { readerFetch } from '../../lib/reader-client';
import { ACCESS_COOKIE, REFRESH_COOKIE, clearSessionCookies } from '../../lib/session';

/** Sign out: revoke upstream (best effort) and clear the cookies. */
export async function POST(request: NextRequest) {
    const blocked = guardWrite(request, { json: false });
    if (blocked) return blocked;
    const access = request.cookies.get(ACCESS_COOKIE)?.value;
    const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
    if (access || refresh) {
        await readerFetch('/v1/api/auth/logout', {
            method: 'POST',
            accessToken: access,
            body: refresh ? { refreshToken: refresh } : {},
        }).catch(() => undefined);
    }
    const res = new NextResponse(null, { status: 204 });
    clearSessionCookies(res);
    return res;
}
