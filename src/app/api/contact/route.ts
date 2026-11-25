import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/shared/libs/email-service';
import { CONTACT_EMAIL } from '@/shared/libs/constants';

/*
 * Best-effort, per-isolate rate limit. Cloudflare runs many isolates, so this
 * only slows a single client down; put a WAF rate-limiting rule on
 * `/api/contact` for a real guarantee.
 */
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;
const MAX_TRACKED_IPS = 5_000;
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();

const MAX_BODY_BYTES = 16 * 1024;
const LIMITS = { name: 100, email: 254, subject: 200, message: 5_000 } as const;
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;
const SPAM_RE = /viagra|casino|lottery|crypto|bitcoin|earn money|make money fast|\$\d+,\d+ a day/i;

type Field = keyof typeof LIMITS;

const SUCCESS = { success: true, message: 'Your message has been sent!' };

function clientIp(request: NextRequest): string {
    // `cf-connecting-ip` is set by Cloudflare and cannot be forged by the
    // client; `x-forwarded-for` can, so it is only a local-dev fallback.
    return (
        request.headers.get('cf-connecting-ip') ??
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        'unknown'
    );
}

function isRateLimited(ip: string, now: number): boolean {
    const entry = ipRequestCounts.get(ip);
    if (entry && now - entry.timestamp < RATE_LIMIT_WINDOW) {
        entry.count += 1;
        return entry.count > MAX_REQUESTS_PER_WINDOW;
    }
    if (ipRequestCounts.size >= MAX_TRACKED_IPS) {
        for (const [key, value] of ipRequestCounts) {
            if (now - value.timestamp >= RATE_LIMIT_WINDOW) ipRequestCounts.delete(key);
        }
        // Still full: drop the oldest entry (Map keeps insertion order).
        if (ipRequestCounts.size >= MAX_TRACKED_IPS) {
            const oldest = ipRequestCounts.keys().next().value;
            if (oldest !== undefined) ipRequestCounts.delete(oldest);
        }
    }
    ipRequestCounts.set(ip, { count: 1, timestamp: now });
    return false;
}

/** Reject cross-site posts so other origins cannot use this form as a mail relay. */
function isSameOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
    try {
        return new URL(origin).host === request.nextUrl.host;
    } catch {
        return false;
    }
}

function readFields(body: unknown): Record<Field, string> | string {
    if (!body || typeof body !== 'object') return 'Invalid request body';
    const input = body as Record<string, unknown>;
    const out = {} as Record<Field, string>;
    for (const field of Object.keys(LIMITS) as Field[]) {
        const raw = input[field];
        if (typeof raw !== 'string' || !raw.trim()) return 'Please fill in all required fields';
        const value = raw.trim();
        if (value.length > LIMITS[field]) return `${field} must be at most ${LIMITS[field]} characters`;
        out[field] = value;
    }
    // Single-line fields must not carry line breaks (header-injection style payloads).
    out.name = out.name.replace(/[\r\n]+/g, ' ');
    out.subject = out.subject.replace(/[\r\n]+/g, ' ');
    if (!EMAIL_RE.test(out.email)) return 'Please provide a valid email address';
    return out;
}

export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
        return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
    }
    if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
        return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }

    if (isRateLimited(clientIp(request), Date.now())) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429, headers: { 'Retry-After': String(RATE_LIMIT_WINDOW / 1000) } }
        );
    }

    try {
        const text = await request.text();
        if (text.length > MAX_BODY_BYTES) {
            return NextResponse.json({ error: 'Request too large' }, { status: 413 });
        }
        let body: unknown;
        try {
            body = JSON.parse(text);
        } catch {
            return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
        }

        const fields = readFields(body);
        if (typeof fields === 'string') {
            return NextResponse.json({ error: fields }, { status: 400 });
        }

        // Silent success for likely spam so bots get no signal.
        if (SPAM_RE.test(fields.message) || SPAM_RE.test(fields.subject)) {
            return NextResponse.json(SUCCESS);
        }

        const success = await sendContactEmail({
            to: CONTACT_EMAIL,
            from: fields.email,
            name: fields.name,
            subject: fields.subject,
            message: fields.message,
        });
        if (!success) throw new Error('Failed to send email');

        return NextResponse.json(SUCCESS);
    } catch (error) {
        console.error('Error sending email:', error instanceof Error ? error.message : error);
        return NextResponse.json(
            { error: 'An error occurred while sending your message. Please try again later.' },
            { status: 500 }
        );
    }
}
