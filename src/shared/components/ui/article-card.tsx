"use client";

import { Badge } from "@/shared/components/ui/badge";
import Link from "next/link";
import { Share2Icon } from "lucide-react";
import AvatarCircles from "@/shared/components/ui/avatar-circles";
import { authorAvatar, authorHref } from "@/shared/libs/author";
import Image from "next/image";
import React from "react";
import { cn } from "@/shared/libs/utils";
import { IArticle } from "@/shared/interfaces/articles";

const ArticleCard = React.memo(({ article, actionChildren, className }: { article: IArticle, actionChildren?: React.ReactNode, className?: string }) => {
    const [imgSrc, setImgSrc] = React.useState(article.thumbnail || '/assets/placeholder/placeholder.svg');

    React.useEffect(() => {
        setImgSrc(article.thumbnail || '/assets/placeholder/placeholder.svg');
    }, [article.thumbnail]);

    const avatars = article?.authors?.map((author) => ({
        imageUrl: authorAvatar(author) ?? '',
        profileUrl: authorHref(author) ?? '',
        title: author.name,
    })) || [];

    const sharePost = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (navigator.share) {
            navigator.share({
                url: `/posts/${article.slug}`,
                title: article.title
            }).catch(err => console.error('Error sharing:', err));
        }
    };

    return (
        <article
            className={cn("col-span-1 top-5 sticky duration-300 drop-shadow-xl drop-shadow-black/2 overflow-hidden max-sm:p-1 p-1 max-sm:rounded-none bg-background group font-sans rounded-[28px] mb-4 ring-1 ring-foreground/5 hover:ring-primary/50 hover:ring-2 transition-all ease-in-out flex flex-col h-85", className)}
            tabIndex={-1}>

            <Image
                src={imgSrc}
                width={512}
                height={512}
                alt={article.title || ""}
                className="object-cover w-full aspect-video duration-300 transition-all ease-in-out max-sm:rounded-none rounded-3xl"
                loading="lazy"
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
                unoptimized={imgSrc.startsWith('http') || imgSrc.includes('?')}
                onError={() => setImgSrc('/assets/placeholder/placeholder.svg')}
            />

            <div className='bg-background/30 z-50 ring-1 w-fit absolute top-2 right-2 ml-auto ring-foreground/10 justify-end flex rounded-full max-sm:rounded-none p-1'>
                {actionChildren ? actionChildren : (
                    <button
                        onClick={sharePost}
                        type="button"
                        aria-label={`Share ${article.title}`}
                        className="flex max-sm:rounded-none rounded-full p-2 hover:ring ring-foreground/20 hover:bg-background/40 text-foreground/90 hover:text-foreground transition-all items-center justify-center">
                        <Share2Icon className="size-4" />
                    </button>
                )}
            </div>

            <div className='ring-1 z-50 bg-background/20 absolute top-[44%] right-5 w-fit ring-foreground/10 justify-end flex max-sm:rounded-none rounded-full p-1'>
                <AvatarCircles numPeople={Math.max(0, avatars.length - 4)} avatarUrls={avatars} />
            </div>

            <h2 className="text-lg px-2.5 mt-4 z-10 font-semibold font-sans leading-8 tracking-tight line-clamp-1">{article.title}</h2>
            <header className='mb-2 px-2 relative flex mt-2 justify-between items-center z-10'>
                <div className="flex gap-2 items-center">
                    {article.tags?.slice(0, 3).map((tagObj, index) => (
                        <Link key={index} href={`/posts?tag=${encodeURIComponent(tagObj.tag)}`} className="text-xs font-sans z-50">
                            <Badge variant="outline" className="text-xs border border-primary/50 hover:bg-foreground/10 transition-colors">{tagObj.tag}</Badge>
                        </Link>
                    ))}
                </div>
            </header>

            <p className='font-normal px-2.5 z-10 text-sm line-clamp-2 text-foreground/80 mb-2'>
                {article.description}
            </p>

            <Link href={`/posts/${article.slug ?? '#'}`} className="inset-0 z-0 absolute" aria-label={article.title} />
        </article>
    );
});

ArticleCard.displayName = 'ArticleCard';
export default ArticleCard;
