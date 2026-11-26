import { upstream, parseUpstream } from '@/app/api/lib/client';
import { IArticleListResponse } from '@/shared/interfaces/articles';

export interface LatestPost {
    title: string;
    slug: string;
}

/**
 * Newest public article for the hero's "New" badge. Server-only: the API key
 * must not reach the client. Returns null on any failure so the badge can
 * fall back to linking the blog index.
 */
export async function getLatestPost(): Promise<LatestPost | null> {
    try {
        const query = new URLSearchParams({
            limit: '1',
            sort: 'created_at',
            order: 'desc',
            status: 'public',
        });
        const response = await upstream(`/v1/api/articles?${query}`, {
            next: { tags: ['articles', 'posts'], revalidate: 3600 },
        });
        const { ok, data } = await parseUpstream<IArticleListResponse>(response);
        const article = ok ? data?.data?.[0] : undefined;
        if (!article?.slug || !article.title) return null;
        return { title: article.title, slug: article.slug };
    } catch (error) {
        console.error('Failed to load latest post:', error);
        return null;
    }
}
