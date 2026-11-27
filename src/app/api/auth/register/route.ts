import { NextRequest, NextResponse } from 'next/server';
import { guardWrite, readJson } from '../../lib/guard';
import { readerFetch } from '../../lib/reader-client';
import { relayError } from '../../lib/sign-in';

/** Create an email account; the API emails a 6-digit code to verify it. */
export async function POST(request: NextRequest) {
    const blocked = guardWrite(request);
    if (blocked) return blocked;
    const body = await readJson<{ name?: unknown; email?: unknown; password?: unknown }>(request);
    if (typeof body?.name !== 'string' || typeof body.email !== 'string' || typeof body.password !== 'string') {
        return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }
    const upstream = await readerFetch('/v1/api/auth/email/register', {
        method: 'POST',
        body: { name: body.name.trim().slice(0, 100), email: body.email.trim(), password: body.password },
    });
    if (!upstream.ok) return relayError(upstream, 'Could not create the account');
    return NextResponse.json({ ok: true }, { status: 201 });
}
