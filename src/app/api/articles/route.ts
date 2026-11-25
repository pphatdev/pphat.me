import { NextRequest } from 'next/server';
import { upstream, mirrorResponse, pickQuery } from '../lib/client';

/** Query params the public list may forward. `status` is never forwarded. */
const ALLOWED_QUERY = ['page', 'limit', 'search', 'sort', 'order', 'tags', 'authors'] as const;

export async function GET(request: NextRequest): Promise<Response> {
    const query = pickQuery(request.nextUrl.searchParams, ALLOWED_QUERY);
    query.set('status', 'public');

    const upstreamRes = await upstream(`/v1/api/articles?${query}`);
    return mirrorResponse(upstreamRes);
}
