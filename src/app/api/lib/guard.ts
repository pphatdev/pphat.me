import { NextRequest, NextResponse } from 'next/server';

/** Reject cross-site requests (CSRF) for routes that change state. */
export function isSameOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
    try {
        return new URL(origin).host === request.nextUrl.host;
    } catch {
        return false;
    }
}

/**
 * @description Guard for state-changing reader routes: same-origin and, when a
 * body is expected, JSON. Returns an error response, or null to continue.
 */
export function guardWrite(request: NextRequest, { json = true }: { json?: boolean } = {}): NextResponse | null {
    if (!isSameOrigin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (json && !request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
        return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
    }
    return null;
}

/** Parse a small JSON body; null when missing or invalid. */
export async function readJson<T>(request: NextRequest, maxBytes = 16 * 1024): Promise<T | null> {
    const text = await request.text();
    if (!text || text.length > maxBytes) return null;
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}
