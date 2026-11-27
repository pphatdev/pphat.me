import { NextRequest, NextResponse } from 'next/server';
import { guardWrite, readJson } from '../../lib/guard';
import { readerFetch } from '../../lib/reader-client';
import { relayError, signInResponse } from '../../lib/sign-in';

/** Confirm the emailed 6-digit code; signs the reader in. */
export async function POST(request: NextRequest) {
    const blocked = guardWrite(request);
    if (blocked) return blocked;
    const body = await readJson<{ email?: unknown; otp?: unknown }>(request);
    if (typeof body?.email !== 'string' || typeof body.otp !== 'string' || !/^\d{6}$/.test(body.otp.trim())) {
        return NextResponse.json({ error: 'Enter the 6-digit code from your email' }, { status: 400 });
    }
    const upstream = await readerFetch('/v1/api/auth/email/verify', {
        method: 'POST',
        body: { email: body.email.trim(), otp: body.otp.trim() },
    });
    if (!upstream.ok) return relayError(upstream, 'Verification failed');
    return signInResponse(await upstream.json());
}
