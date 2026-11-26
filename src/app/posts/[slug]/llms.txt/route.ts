/** GET /posts/[slug]/llms.txt: the post as Markdown for LLMs, from the API's /articles/<slug>/llms.txt. */
import { safeSegment } from '@/app/api/lib/client';
import { proxyLlms } from '@/shared/seo/llms';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
): Promise<Response> {
    const slug = safeSegment((await params).slug);
    if (!slug) return new Response('# Not found\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    return proxyLlms(`/articles/${slug}/llms.txt`, ['articles', 'posts']);
}
