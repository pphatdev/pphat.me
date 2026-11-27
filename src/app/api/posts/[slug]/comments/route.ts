import { NextRequest, NextResponse } from 'next/server';
import { notFoundResponse, pickQuery, safeSegment } from '../../../lib/client';
import { guardWrite, readJson } from '../../../lib/guard';
import { readerFetch } from '../../../lib/reader-client';
import { asReader, finish } from '../../../lib/session';

const MAX_COMMENT_LENGTH = 5000;
type Params = { params: Promise<{ slug: string }> };

/** Public comment list (newest first, paginated). */
export async function GET(request: NextRequest, { params }: Params) {
    const slug = safeSegment((await params).slug);
    if (!slug) return notFoundResponse();
    const query = pickQuery(request.nextUrl.searchParams, ['page', 'limit']);
    const upstream = await readerFetch(`/v1/api/articles/${slug}/comments${query.size ? `?${query}` : ''}`);
    return finish({ upstream });
}

/** Post a comment as the signed-in reader. */
export async function POST(request: NextRequest, { params }: Params) {
    const blocked = guardWrite(request);
    if (blocked) return blocked;
    const slug = safeSegment((await params).slug);
    if (!slug) return notFoundResponse();
    const body = await readJson<{ content?: unknown }>(request);
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content || content.length > MAX_COMMENT_LENGTH) {
        return NextResponse.json({ error: `Comment must be 1-${MAX_COMMENT_LENGTH} characters` }, { status: 400 });
    }
    return finish(
        await asReader(request, (token) =>
            readerFetch(`/v1/api/articles/${slug}/comments`, { method: 'POST', body: { content }, accessToken: token }),
        ),
    );
}
