/**
 * GET /api/projects/[slug]/details
 *
 * Read-only proxy to the upstream pphat API.
 */

import { NextRequest } from 'next/server';
import { upstream, mirrorResponse, notFoundResponse, safeSegment } from '../../../lib/client';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
    const slug = safeSegment((await params).slug);
    if (!slug) return notFoundResponse();

    const upstreamRes = await upstream(`/v1/api/projects/${slug}/details`);
    return mirrorResponse(upstreamRes);
}
