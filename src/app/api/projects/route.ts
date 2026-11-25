/**
 * GET /api/projects
 *
 * Read-only proxy to the upstream pphat API.
 */

import { NextRequest } from 'next/server';
import { upstream, mirrorResponse, pickQuery } from '../lib/client';

const ALLOWED_QUERY = ['page', 'limit', 'search', 'sort', 'order', 'tags'] as const;

export async function GET(request: NextRequest): Promise<Response> {
    const query = pickQuery(request.nextUrl.searchParams, ALLOWED_QUERY);
    const upstreamRes = await upstream(`/v1/api/projects${query.size ? `?${query}` : ''}`);
    return mirrorResponse(upstreamRes);
}
