import { NextRequest } from 'next/server';
import { notFoundResponse, safeSegment } from '../../../../lib/client';
import { guardWrite } from '../../../../lib/guard';
import { readerFetch } from '../../../../lib/reader-client';
import { asReader, finish } from '../../../../lib/session';

/** Delete one of the reader's own comments (the API enforces ownership). */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string; id: string }> }) {
    const blocked = guardWrite(request, { json: false });
    if (blocked) return blocked;
    const { slug: rawSlug, id } = await params;
    const slug = safeSegment(rawSlug);
    if (!slug || !/^\d{1,12}$/.test(id)) return notFoundResponse();
    return finish(
        await asReader(request, (token) =>
            readerFetch(`/v1/api/articles/${slug}/comments/${id}`, { method: 'DELETE', accessToken: token }),
        ),
    );
}
