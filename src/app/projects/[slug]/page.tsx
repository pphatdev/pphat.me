import "../../../shared/styles/code-block-node.css"
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { cacheLife } from 'next/cache';
import { safeSegment, upstream } from '@/app/api/lib/client';

import { GridPattern } from '@/shared/components/background/grid-pattern';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { ArrowLeftIcon, ArrowRightIcon, Calendar, Clock, ExternalLink, User } from 'lucide-react';
import { MarkdownRenderer } from '@/shared/extension/markdown/renderer';
import { GradientText } from '@/shared/components/ui/gradient-text';
import { PostCoverImage } from './cover';
import { ScrollToTopButton } from '@/shared/components/ui/scroll-to-top';
import Footer from '@/shared/components/layouts/footer';
import { IProjectDetailResponse } from '@/shared/interfaces/projects';
import { appName } from '@/shared/data';
import GithubIcon from "@/shared/components/icons/github";
import { Spinner } from '@/shared/components/ui/loading';
import { getOrigin } from '@/shared/seo/origin';

interface Params {
    params: Promise<{
        slug: string;
    }>;
}




export async function generateMetadata(props: Params): Promise<Metadata> {
    const params = await props.params;
    const project = await getProjectDetail(params.slug);
    const data = project?.data;

    if (!project) {
        return {
            title: `Project Not Found`,
            description: 'The requested project could not be found',
        };
    }

    const origin = await getOrigin();

    return {
        title: `${data.title}`,
        description: data.description,
        alternates: { canonical: `/projects/${data.slug}` },
        authors: data.contributors?.map((author) => ({
            name: author.name,
            url: author.url,
        })) || [{
            name: appName,
            url: origin,
        }],
        openGraph: {
            title: `${data.title}`,
            description: data.description,
            type: 'website',
            url: `/projects/${data.slug}`,
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


const getProjectDetail = async (slug: string): Promise<IProjectDetailResponse> => {
    const segment = safeSegment(slug);
    if (!segment) throw new Error('Invalid project slug');
    try {
        const response = await upstream(`/v1/api/projects/${segment}`, {
            method: 'GET',
        });

        if (!response.ok) {
            console.error(`Failed to fetch project upstream with slug ${slug}:`, response.statusText);
            throw new Error(`Failed to fetch project upstream with slug ${slug}`);
        }

        const data = await response.json();
        return data as IProjectDetailResponse;
    }
    catch (error) {
        console.error(`Error fetching project upstream with slug ${slug}:`, error);
        throw error;
    }
};




export default async function ProjectDetail(props: Params) {
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

                <Suspense fallback={
                    <div className="container flex min-h-svh flex-col justify-center items-center mx-auto py-16 text-center">
                        <Spinner variant="bars" />
                    </div>
                }>
                    <ProjectContent params={props.params} />
                </Suspense>
            </div>

            <Footer />

            <ScrollToTopButton />
        </>
    );
}

async function ProjectContent({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const project = await getProjectDetail(slug);
    if (!project || !project.data) {
        return (
            <div className='container flex min-h-svh flex-col justify-center items-center mx-auto py-16 text-center pt-32'>
                <h1 className='text-4xl font-bold mb-4'>Project Not Found</h1>
                <p className='text-foreground/50 mb-8'> The project you are looking for does not exist. </p>

                <Button asChild className='ring'>
                    <Link href='/projects'>
                        <ArrowLeftIcon className='w-4 h-4 mr-2' /> Back to Projects
                    </Link>
                </Button>
            </div>
        );
    }

    const data = project.data;

    return (
        <article className='max-w-5xl sm:px-4 relative mx-auto max-xs:pt-0 sm:mt-16 max-sm:pb-0 py-8'>
            {data.thumbnail && (
                <div className='relative w-full sm:p-2 ring-1 rounded-3xl ring-foreground/10 h-full max-xs:max-h-96 md:h-116 max-xs:rounded-none max-xs:rounded-b-4xl overflow-hidden'>
                    <PostCoverImage src={data.thumbnail} alt={data.title} />
                </div>
            )}

            <div className='flex items-center justify-between gap-2 mt-7 py-4 order-2'>
                <Button asChild variant="outline" className='h-9'>
                    <Link href='/projects'>
                        <ArrowLeftIcon className='w-4 h-4' /> Back
                    </Link>
                </Button>

                <div className='flex justify-end items-center py-4 gap-2 flex-wrap'>
                    <Button asChild className='mt-0'>
                        <Link href={data.details?.repoUrl || '#'} target='_blank' rel='noopener noreferrer'>
                            <GithubIcon className='w-4 h-4' />
                            <span className="max-sm:hidden">Source Code</span>
                        </Link>
                    </Button>
                    <Button asChild className='mt-0'>
                        <Link href={data.details?.demoUrl || '#'} target='_blank' rel='noopener noreferrer'>
                            <ExternalLink className='w-4 h-4' />
                            <span className="max-sm:hidden">Live Demo</span>
                        </Link>
                    </Button>
                </div>
            </div>

            <div className='flex max-sm:my-2 my-8 flex-col relative order-1'>
                <h1 className='text-4xl md:text-5xl font-bold leading-tight'> <GradientText>{data.title}</GradientText> </h1>
                <div className='flex gap-2 flex-wrap items-center mt-2 justify-between'>
                    {(data.tags?.length || 0) > 0 && (
                        <div className='flex flex-wrap w-fit justify-start gap-1 bg-background'>
                            {(data.tags ?? []).map((tag) => (
                                <Badge key={tag.id} variant='outline' className='py-1 rounded-md tracking-widest leading-tight font-open-sans'> @{tag.tag} </Badge>
                            ))}
                        </div>
                    )}
                </div>
                <p className='text-base text-foreground/50 mt-5 tracking-wide leading-relaxed font-sans'>{data.description}</p>
            </div>

            {data.createdAt && (
                <div className='flex items-center gap-2 mb-5 justify-start'>
                    <div className='flex items-center space-x-1 max-sm:text-xs text-sm text-foreground/50'>
                        <Calendar className='size-4' />
                        <time dateTime={data.createdAt} className='whitespace-nowrap'>
                            {new Date(data.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', })}
                        </time>
                    </div>
                    <div className='flex items-center space-x-1 max-sm:text-xs text-sm text-foreground/50 whitespace-nowrap'>
                        <Clock className='w-4 h-4' />
                        <span>{formatDistanceToNow(new Date(data.createdAt))} ago</span>
                    </div>
                </div>
            )}

            <ul className="py-2 gap-1 sm:gap-4 items-center flex">

                {(data.contributors ?? []).map((author, index) => (
                    <li key={index} className='flex items-center'>
                        <Link
                            rel='noopener noreferrer'
                            target='_blank'
                            href={author.url === '' ? String(author.profile).replace('.png', '') : author.url}
                            className='flex items-center space-x-2'
                        >
                            <Avatar className='w-8 h-8'>
                                <AvatarImage src={author.profile} alt={author.name} />
                                <AvatarFallback>
                                    <User className='w-4 h-4' />
                                </AvatarFallback>
                            </Avatar>
                            <p className='font-medium text-sm'>{author.name}</p>
                        </Link>

                        {index < (data.contributors?.length ?? 0) - 1 && (
                            <div className='mx-2 sm:mx-4 h-4 w-px bg-foreground/30' />
                        )}
                    </li>
                ))}
            </ul>

            <div className='py-5 '>
                <div className='mx-auto pb-10 border-b border-foreground/10'>
                    <MarkdownRenderer content={data.details.content} />
                </div>

                <div className='flex flex-col gap-3 mt-10'>
                    <div className='flex items-center mx-auto justify-between w-full gap-3'>
                        {project.navigation.prev ? (
                            <Button asChild variant={'outline'} className="max-sm:px-2">
                                <Link href={`${project.navigation.prev}`}>
                                    <ArrowLeftIcon className='w-4 h-4 shrink-0' />
                                    <span className='sm:hidden'>Prev</span>
                                    <span className='max-sm:hidden'>Previous</span>
                                </Link>
                            </Button>
                        ) : (<div />)}

                        {project.navigation.next ? (
                            <Button asChild variant={'outline'} className="max-sm:px-2">
                                <Link href={`${project.navigation.next}`}>
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
    );
}