import { NextRequest } from 'next/server';
import { notFoundResponse, safeSegment } from '../../../lib/client';
import { readerFetch } from '../../../lib/reader-client';
import { finish } from '../../../lib/session';

/** Public reaction counts. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const slug = safeSegment((await params).slug);
    if (!slug) return notFoundResponse();
    return finish({ upstream: await readerFetch(`/v1/api/articles/${slug}/reactions`) });
}
