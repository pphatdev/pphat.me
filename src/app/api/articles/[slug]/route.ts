import { NextRequest } from 'next/server';
import { upstream, mirrorResponse, notFoundResponse, parseUpstream, safeSegment } from '../../lib/client';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
    const slug = safeSegment((await params).slug);
    if (!slug) return notFoundResponse();

    const upstreamRes = await upstream(`/v1/api/articles/${slug}`);
    if (!upstreamRes.ok) return mirrorResponse(upstreamRes);

    // The upstream detail endpoint does not filter unpublished articles, so
    // hide drafts here rather than leak them by slug.
    const { data } = await parseUpstream<{ data?: { published?: boolean } }>(upstreamRes);
    if (!data?.data?.published) return notFoundResponse();
    return Response.json(data, { headers: { 'X-Content-Type-Options': 'nosniff' } });
}
