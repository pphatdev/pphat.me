/**
 * GET /feed.xml: RSS 2.0 feed of the latest public posts, for feed readers and
 * crawlers. Advertised site-wide via <link rel="alternate"> in seo/head.tsx.
 */
import { upstream } from '@/app/api/lib/client';
import type { IArticle, IArticleListResponse } from '@/shared/interfaces/articles';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/shared/seo/site';
import { absoluteUrl } from '@/shared/seo/structured-data';
import { parseApiDate } from '@/shared/seo/content';

const FEED_SIZE = 50;

function xml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function rfc822(value: string | null | undefined): string | null {
    return parseApiDate(value)?.toUTCString() ?? null;
}

function item(post: IArticle): string {
    const url = `${SITE_URL}/posts/${encodeURIComponent(post.slug)}`;
    const date = rfc822(post.createdAt);
    const author = post.authors?.[0]?.name || post.owner?.name || SITE_NAME;
    return [
        '    <item>',
        `      <title>${xml(post.title)}</title>`,
        `      <link>${xml(url)}</link>`,
        `      <guid isPermaLink="true">${xml(url)}</guid>`,
        date ? `      <pubDate>${date}</pubDate>` : '',
        `      <dc:creator>${xml(author)}</dc:creator>`,
        post.description ? `      <description>${xml(post.description)}</description>` : '',
        ...(post.tags ?? []).map((t) => `      <category>${xml(t.tag)}</category>`),
        post.thumbnail ? `      <media:content url="${xml(absoluteUrl(post.thumbnail))}" medium="image" />` : '',
        '    </item>',
    ].filter(Boolean).join('\n');
}

export async function GET(): Promise<Response> {
    // Only public posts, regardless of the API key's role.
    const res = await upstream(`/v1/api/articles?status=public&limit=${FEED_SIZE}`);
    if (!res.ok) {
        return new Response('Feed temporarily unavailable', { status: 503, headers: { 'Retry-After': '300' } });
    }
    const { data = [] } = (await res.json()) as IArticleListResponse;
    const posts = data.filter((p) => p.published && p.slug);
    const lastBuild = rfc822(posts[0]?.updatedAt || posts[0]?.createdAt) ?? new Date().toUTCString();

    const body = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">',
        '  <channel>',
        `    <title>${xml(`${SITE_NAME} Blog`)}</title>`,
        `    <link>${SITE_URL}/posts</link>`,
        `    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />`,
        `    <description>${xml(SITE_DESCRIPTION)}</description>`,
        '    <language>en</language>',
        `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
        posts.map(item).join('\n'),
        '  </channel>',
        '</rss>',
        '',
    ].join('\n');

    return new Response(body, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
