import { NextRequest } from 'next/server';
import { notFoundResponse, safeSegment } from '../../../../lib/client';
import { guardWrite } from '../../../../lib/guard';
import { isReactionType, readerFetch } from '../../../../lib/reader-client';
import { asReader, finish } from '../../../../lib/session';

type Params = { params: Promise<{ slug: string; type: string }> };

async function react(request: NextRequest, { params }: Params, method: 'POST' | 'DELETE') {
    const blocked = guardWrite(request, { json: false });
    if (blocked) return blocked;
    const { slug: rawSlug, type } = await params;
    const slug = safeSegment(rawSlug);
    if (!slug || !isReactionType(type)) return notFoundResponse();
    return finish(
        await asReader(request, (token) =>
            readerFetch(`/v1/api/articles/${slug}/reactions/${type}`, { method, accessToken: token }),
        ),
    );
}

/** Add the reader's reaction (idempotent per reader). */
export function POST(request: NextRequest, ctx: Params) {
    return react(request, ctx, 'POST');
}

/** Remove the reader's reaction. */
export function DELETE(request: NextRequest, ctx: Params) {
    return react(request, ctx, 'DELETE');
}
