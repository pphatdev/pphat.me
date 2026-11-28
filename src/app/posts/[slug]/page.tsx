import "../../../shared/styles/code-block-node.css"
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GridPattern } from '@/shared/components/background/grid-pattern';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeftIcon, ArrowRightIcon, BookOpen, Calendar, Clock, ExternalLink } from 'lucide-react';
import { ViewCounter } from './view-counter';
import { Reactions } from './reactions';
import { Comments } from './comments';
import { Credits } from './credits';
import { MarkdownRenderer } from '@/shared/extension/markdown/renderer';
import { PostCoverImage } from '../../projects/[slug]/cover'; // Reusing cover component
import { ScrollToTopButton } from '@/shared/components/ui/scroll-to-top';
import Footer from '@/shared/components/layouts/footer';
import { IArticleDetailResponse } from '@/shared/interfaces/articles';
import { appName } from '@/shared/data';
import { ADMIN_URL } from '@/shared/libs/constants';
import { slugFromNavigation } from '@/shared/libs/content';
import { getOrigin } from '@/shared/seo/origin';
import { SITE_NAME, SITE_OG_IMAGE } from '@/shared/seo/site';
import { isoDate, itemKeywords } from '@/shared/seo/content';
import { JsonLd, postStructuredData } from '@/shared/seo/structured-data';

interface Params {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata(props: Params): Promise<Metadata> {
    const params = await props.params;
    const article = await getArticleDetail(params.slug);
    const data = article?.data;

    if (!data) notFound();

    const origin = await getOrigin();

    return {
        title: `${data.title}`,
        description: data.description,
        // The post's own keywords from the API, else its tags.
        keywords: itemKeywords(data),
        alternates: {
            canonical: `/posts/${data.slug}`,
            types: { 'text/markdown': `/posts/${encodeURIComponent(data.slug)}/llms.txt` },
        },
        // Author profiles, else the post's owner (a member's own post), else the site.
        authors: data.authors?.length
            ? data.authors.map((author) => ({ name: author.name, url: author.url }))
            : data.owner?.name
                ? [{ name: data.owner.name }]
                : [{ name: appName, url: origin }],
        // openGraph replaces the layout's object wholesale, so repeat site fields.
        openGraph: {
            title: `${data.title}`,
            description: data.description,
            type: 'article',
            url: `/posts/${data.slug}`,
            siteName: SITE_NAME,
            locale: 'en_US',
            publishedTime: isoDate(data.createdAt),
            modifiedTime: isoDate(data.updatedAt),
            authors: data.authors?.map((author) => author.name),
            tags: data.tags?.map((tag) => tag.tag),
            images: data.thumbnail ? [{ url: data.thumbnail.toString() }] : [SITE_OG_IMAGE],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${data.title}`,
            description: data.description,
            images: [data.thumbnail ? data.thumbnail.toString() : SITE_OG_IMAGE.url],
        },
    };
}

import { safeSegment, upstream } from '@/app/api/lib/client';

// cache(): generateMetadata, the page and BlogContent share one request per render.
const getArticleDetail = cache(async (slug: string): Promise<IArticleDetailResponse | null> => {
    const segment = safeSegment(slug);
    if (!segment) return null;
    try {
        const response = await upstream(`/v1/api/articles/${segment}`, {
            method: 'GET',
        });

        // Only a real "not found" becomes a 404. Other failures throw, so an
        // API outage serves an error instead of telling crawlers the post is gone.
        if (response.status === 404) return null;
        if (!response.ok) {
            throw new Error(`Failed to fetch article ${slug}: HTTP ${response.status}`);
        }

        const data = (await response.json()) as IArticleDetailResponse;
        // The upstream detail endpoint does not filter drafts; never render them.
        if (!data?.data?.published) return null;
        return data;
    }
    catch (error) {
        console.error(`Error fetching article with slug ${slug}:`, error);
        throw error;
    }
});

import { cache, Suspense } from 'react';
import { Spinner } from '@/shared/components/ui/loading';

export default async function BlogDetail(props: Params) {
    // Resolve the post before the Suspense shell streams, so a missing post
    // gets a real 404 status rather than a 200 with noindex. The fetch is
    // memoized per request, so BlogContent reuses this response.
    const { slug } = await props.params;
    if (!(await getArticleDetail(slug))) notFound();

    return (
        <Suspense fallback={
            <div className="w-full min-h-screen flex flex-col">
                <div className="flex-1 flex justify-center items-center py-32">
                    <Spinner variant="bars" />
                </div>
            </div>
        }>
            <BlogContent params={props.params} />
        </Suspense>
    );
}

async function BlogContent({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const articleRes = await getArticleDetail(resolvedParams.slug);

    if (!articleRes || !articleRes.data) notFound();

    const data = articleRes.data;
    const prevSlug = slugFromNavigation(articleRes.navigation?.prev);
    const nextSlug = slugFromNavigation(articleRes.navigation?.next);
    const createdAt = data.createdAt ? new Date(data.createdAt) : null;

    return (
        <>
            <JsonLd data={postStructuredData(data, itemKeywords(data))} />
            <div className="max-sm:px-3">
                <div className='absolute inset-y-0 left-0 right-0 pointer-events-none opacity-60' aria-hidden='true'>
                    <GridPattern
                        width={30}
                        height={30}
                        x={-1}
                        y={-1}
                        className={'mask-[linear-gradient(to_bottom_right,white,transparent,transparent)] '}
                    />
                </div>

                <article className='relative mx-auto max-w-5xl pt-24 pb-8 sm:px-4 sm:pt-28'>
                    {data.thumbnail && (
                        <div className='relative h-64 w-full overflow-hidden rounded-2xl bg-muted sm:h-96 md:h-116'>
                            <PostCoverImage src={data.thumbnail} alt={data.title} className='aspect-auto object-center rounded-none ring-0 max-sm:rounded-none' />
                        </div>
                    )}

                    <div className='mt-8 flex items-center justify-between gap-2 sm:mt-12'>
                        <Link
                            href='/posts'
                            className='inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10'
                        >
                            <ArrowLeftIcon className='size-4' /> Back to Blogs
                        </Link>
                        <a
                            href={`${ADMIN_URL}/articles/${encodeURIComponent(data.slug)}`}
                            target='_blank'
                            rel='noopener noreferrer nofollow'
                            className='inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10'
                        >
                            <ExternalLink className='size-4' /> Edit Post
                        </a>
                    </div>

                    <header className='mt-6'>
                        <h1 className='text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl'>
                            {data.title}
                        </h1>

                        {(data.tags?.length ?? 0) > 0 && (
                            <ul className='mt-4 flex flex-wrap gap-2' aria-label='Tags'>
                                {(data.tags ?? []).map((tag) => (
                                    <li key={tag.id}>
                                        <Link
                                            href={`/posts?tag=${encodeURIComponent(tag.tag)}`}
                                            className='inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary'
                                        >
                                            {tag.tag}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className='mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-foreground/10 pb-8 text-sm text-foreground/60'>
                            <Credits article={data} />

                            {createdAt && (
                                <>
                                    <span className='flex items-center gap-1.5 whitespace-nowrap'>
                                        <Calendar className='size-4' />
                                        <time dateTime={data.createdAt}>
                                            {createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </time>
                                    </span>
                                    <span className='flex items-center gap-1.5 whitespace-nowrap'>
                                        <Clock className='size-4' />
                                        {formatDistanceToNow(createdAt)} ago
                                    </span>
                                </>
                            )}
                            {data.stats?.readingMins !== undefined && (
                                <span className='flex items-center gap-1.5 whitespace-nowrap'>
                                    <BookOpen className='size-4' />
                                    {data.stats.readingMins} min read
                                </span>
                            )}
                            <ViewCounter slug={data.slug} initialViews={data.stats?.views ?? 0} />
                        </div>
                    </header>

                    <div className='py-8'>
                        <div className='mx-auto border-b border-foreground/10 pb-10'>
                            <MarkdownRenderer content={data.content} />
                            <div className='mt-10'>
                                <Reactions slug={data.slug} />
                            </div>
                        </div>
                        <Comments slug={data.slug} />

                        {(prevSlug || nextSlug) && (
                            <nav className='mt-10 flex items-center justify-between gap-3' aria-label='More posts'>
                                {prevSlug ? (
                                    <Button asChild variant='outline' className='max-sm:px-2'>
                                        <Link href={`/posts/${encodeURIComponent(prevSlug)}`}>
                                            <ArrowLeftIcon className='size-4 shrink-0' /> Previous
                                        </Link>
                                    </Button>
                                ) : (<span />)}
                                {nextSlug ? (
                                    <Button asChild variant='outline' className='max-sm:px-2'>
                                        <Link href={`/posts/${encodeURIComponent(nextSlug)}`}>
                                            Next <ArrowRightIcon className='size-4 shrink-0' />
                                        </Link>
                                    </Button>
                                ) : (<span />)}
                            </nav>
                        )}
                    </div>
                </article>
            </div>

            <Footer />

            <ScrollToTopButton />
        </>
    );
}
