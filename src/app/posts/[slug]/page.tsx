import "../../../shared/styles/code-block-node.css"
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Metadata } from 'next';

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
import { getOrigin } from '@/shared/seo/origin';
import { SITE_NAME, SITE_OG_IMAGE } from '@/shared/seo/site';
import { itemKeywords } from '@/shared/seo/content';

interface Params {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata(props: Params): Promise<Metadata> {
    const params = await props.params;
    const article = await getArticleDetail(params.slug);
    const data = article?.data;

    if (!data) {
        return {
            title: `Article Not Found`,
            description: 'The requested article could not be found',
        };
    }

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
            publishedTime: data.createdAt,
            modifiedTime: data.updatedAt,
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

const getArticleDetail = async (slug: string): Promise<IArticleDetailResponse | null> => {
    const segment = safeSegment(slug);
    if (!segment) return null;
    try {
        const response = await upstream(`/v1/api/articles/${segment}`, {
            method: 'GET',
        });

        if (!response.ok) {
            console.error(`Failed to fetch article with slug ${slug}:`, response.statusText);
            return null;
        }

        const data = (await response.json()) as IArticleDetailResponse;
        // The upstream detail endpoint does not filter drafts; never render them.
        if (!data?.data?.published) return null;
        return data;
    }
    catch (error) {
        console.error(`Error fetching article with slug ${slug}:`, error);
        return null;
    }
};

import { Suspense } from 'react';
import { Spinner } from '@/shared/components/ui/loading';

export default function BlogDetail(props: Params) {
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

/** Neighbour links arrive as absolute URLs (`…/articles/<slug>`); keep only the slug. */
function slugFromNavigation(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
        const last = new URL(value).pathname.split('/').filter(Boolean).pop();
        return last ? decodeURIComponent(last) : null;
    } catch {
        return null;
    }
}

async function BlogContent({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;
    const articleRes = await getArticleDetail(resolvedParams.slug);

    if (!articleRes || !articleRes.data) {
        return (
            <>
                <GridPattern width={30} height={30} x={-1} y={-1} className={'mask-[linear-gradient(to_bottom_right,white,transparent,transparent)] '} />
                <div className='container flex min-h-svh flex-col justify-center items-center mx-auto py-16 text-center'>
                    <h1 className='text-4xl font-bold mb-4'>Article Not Found</h1>
                    <p className='text-foreground/50 mb-8'> The article you are looking for does not exist. </p>

                    <Button asChild className='ring'>
                        <Link href='/posts'>
                            <ArrowLeftIcon className='w-4 h-4 mr-2' /> Back to Posts
                        </Link>
                    </Button>
                </div>
            </>
        );
    }

    const data = articleRes.data;
    const prevSlug = slugFromNavigation(articleRes.navigation?.prev);
    const nextSlug = slugFromNavigation(articleRes.navigation?.next);
    const createdAt = data.createdAt ? new Date(data.createdAt) : null;

    return (
        <>
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
