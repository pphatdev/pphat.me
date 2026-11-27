import { NextRequest, NextResponse } from 'next/server';
import { guardWrite, readJson } from '../../lib/guard';
import { readerFetch } from '../../lib/reader-client';
import { relayError, signInResponse } from '../../lib/sign-in';

/** Email + password sign-in. Unverified accounts get a 4xx that the UI turns into the code step. */
export async function POST(request: NextRequest) {
    const blocked = guardWrite(request);
    if (blocked) return blocked;
    const body = await readJson<{ email?: unknown; password?: unknown }>(request);
    if (typeof body?.email !== 'string' || typeof body.password !== 'string') {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const upstream = await readerFetch('/v1/api/auth/email/login', {
        method: 'POST',
        body: { email: body.email.trim(), password: body.password },
    });
    if (!upstream.ok) return relayError(upstream, 'Sign-in failed');
    return signInResponse(await upstream.json());
}
