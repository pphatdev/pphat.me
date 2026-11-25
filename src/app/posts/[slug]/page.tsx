import "../../../shared/styles/code-block-node.css"
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Metadata } from 'next';

import { NavigationBar } from '@/shared/components/layouts/navbar';
import { GridPattern } from '@/shared/components/background/grid-pattern';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { ArrowLeftIcon, ArrowRightIcon, Calendar, Clock, User, Eye } from 'lucide-react';
import { MarkdownRenderer } from '@/shared/extension/markdown/renderer';
import { PostCoverImage } from '../../projects/[slug]/cover'; // Reusing cover component
import { ScrollToTopButton } from '@/shared/components/ui/scroll-to-top';
import Footer from '@/shared/components/layouts/footer';
import { IArticleDetailResponse } from '@/shared/interfaces/articles';
import { appName } from '@/shared/data';
import { getOrigin } from '@/shared/seo/origin';

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
        alternates: { canonical: `/posts/${data.slug}` },
        authors: data.authors?.map((author) => ({
            name: author.name,
            url: author.url,
        })) || [{
            name: appName,
            url: origin,
        }],
        openGraph: {
            title: `${data.title}`,
            description: data.description,
            type: 'article',
            url: `/posts/${data.slug}`,
            images: data.thumbnail ? [{ url: data.thumbnail.toString() }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${data.title}`,
            description: data.description,
            images: data.thumbnail ? [{ url: data.thumbnail.toString() }] : undefined,
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
                <NavigationBar className='fixed' />
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

    if (!articleRes || !articleRes.data) {
        return (
            <>
                <GridPattern width={30} height={30} x={-1} y={-1} className={'mask-[linear-gradient(to_bottom_right,white,transparent,transparent)] '} />
                <NavigationBar className='sticky' />

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

    return (
        <>
            <NavigationBar className='fixed' />

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

                <article className='max-w-5xl sm:px-4 relative mx-auto max-xs:pt-0 sm:mt-16 max-sm:pb-0 py-8'>
                    {data.thumbnail && (
                        <div className='relative w-full sm:p-2 ring-1 rounded-3xl ring-foreground/10 h-full max-xs:max-h-96 md:h-116 max-xs:rounded-none max-xs:rounded-b-4xl overflow-hidden'>
                            <PostCoverImage src={data.thumbnail} alt={data.title} />
                        </div>
                    )}

                    <div className='flex items-center justify-between gap-2 mt-7 py-4 order-2'>
                        <Button asChild variant="outline" className='h-9'>
                            <Link href='/posts'>
                                <ArrowLeftIcon className='w-4 h-4' /> Back
                            </Link>
                        </Button>
                    </div>

                    <div className='flex max-sm:my-2 my-8 flex-col relative order-1'>
                        <h1 className='text-4xl md:text-5xl font-bold leading-tight'>
                            <span className="text-left bg-background bg-clip-text bg-no-repeat text-transparent bg-linear-to-r from-sky-500 via-teal-500 to-green-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
                                {data.title}
                            </span>
                        </h1>
                        <div className='flex gap-2 flex-wrap w-full items-center mt-2 justify-between'>
                            {(data.tags?.length || 0) > 0 && (
                                <div className='flex flex-wrap w-full justify-start gap-1 bg-background'>
                                    {(data.tags ?? []).map((tag) => (
                                        <Badge key={tag.id} variant='outline' className='py-1 rounded-md tracking-widest leading-tight font-open-sans'> @{tag.tag} </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className='text-base text-foreground/50 mt-5 tracking-wide leading-relaxed font-sans'>{data.description}</p>
                    </div>

                    <div className='flex items-center gap-4 mb-5 justify-start flex-wrap'>
                        {data.createdAt && (
                            <>
                                <div className='flex items-center space-x-1 max-sm:text-xs text-sm text-foreground/50'>
                                    <Calendar className='size-4' />
                                    <time dateTime={data.createdAt} className='whitespace-nowrap'>
                                        {new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </time>
                                </div>
                                <div className='flex items-center space-x-1 max-sm:text-xs text-sm text-foreground/50 whitespace-nowrap'>
                                    <Clock className='w-4 h-4' />
                                    <span>{formatDistanceToNow(new Date(data.createdAt))} ago</span>
                                </div>
                            </>
                        )}
                        {data.stats?.readingMins !== undefined && (
                            <div className='flex items-center space-x-1 max-sm:text-xs text-sm text-foreground/50 whitespace-nowrap'>
                                <Clock className='w-4 h-4 text-primary/70' />
                                <span>{data.stats.readingMins} min read</span>
                            </div>
                        )}
                        {data.stats?.views !== undefined && (
                            <div className='flex items-center space-x-1 max-sm:text-xs text-sm text-foreground/50 whitespace-nowrap'>
                                <Eye className='w-4 h-4 text-primary/70' />
                                <span>{data.stats.views} views</span>
                            </div>
                        )}
                    </div>

                    <ul className="py-2 gap-1 sm:gap-4 items-center flex">
                        {(data.authors ?? []).map((author, index) => (
                            <li key={index} className='flex items-center'>
                                <Link
                                    rel='noopener noreferrer'
                                    // target='_blank'
                                    href={!author.url ? (author.profile ? String(author.profile).replace('.png', '') : '#') : author.url}
                                    className='flex items-center space-x-2'
                                >
                                    <Avatar className='w-8 h-8'>
                                        <AvatarImage src={author.profile} alt={author.name} referrerPolicy="no-referrer" />
                                        <AvatarFallback>
                                            <User className='w-4 h-4' />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='flex flex-col'>
                                        <p className='font-medium text-sm leading-tight'>{author.name}</p>
                                        {author.profile && <p className='text-xs text-muted-foreground leading-tight'>{author.profile}</p>}
                                    </div>
                                </Link>

                                {index < (data.authors?.length ?? 0) - 1 && (
                                    <div className='mx-2 sm:mx-4 h-4 w-px bg-foreground/30' />
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className='py-5 '>
                        <div className='mx-auto pb-10 border-b border-foreground/10'>
                            <MarkdownRenderer content={data.content} />
                        </div>

                        <div className='flex flex-col gap-3 mt-10'>
                            <div className='flex items-center mx-auto justify-between w-full gap-3'>
                                {articleRes.navigation?.prev ? (
                                    <Button asChild variant={'outline'} className="max-sm:px-2">
                                        <Link href={`/posts/${articleRes.navigation.prev.slug}`}>
                                            <ArrowLeftIcon className='w-4 h-4 shrink-0' />
                                            <span className='sm:hidden'>Prev</span>
                                            <span className='max-sm:hidden'>Previous</span>
                                        </Link>
                                    </Button>
                                ) : (<div />)}

                                {articleRes.navigation?.next ? (
                                    <Button asChild variant={'outline'} className="max-sm:px-2">
                                        <Link href={`/posts/${articleRes.navigation.next.slug}`}>
                                            <ArrowRightIcon className='w-4 h-4 shrink-0' />
                                            <span className='sm:hidden'>Next</span>
                                            <span className='max-sm:hidden'>Next</span>
                                        </Link>
                                    </Button>
                                ) : (<div />)}
                            </div>
                        </div>
                    </div>

                </article>
            </div>

            <Footer />

            <ScrollToTopButton />
        </>
    );
}
