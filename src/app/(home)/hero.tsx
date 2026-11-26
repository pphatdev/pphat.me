"use client";

import { BlurFade } from "@/shared/components/background/blur-fade";
import RainbowEffects from "@/shared/components/background/rainbow-effects";
import { Badge } from "@/shared/components/ui/badge";
import { Cover } from "@/shared/components/ui/cover";
import { FlipWords } from "@/shared/components/ui/flip-words";
import MagneticArea from "@/shared/components/ui/magnetic-area";
import { Skills } from "@/shared/components/ui/skills";
import { ThemeToggle } from "@/shared/components/ui/theme-switch";
import { appDescriptions, appName, appPositions } from "@/shared/data";
import { cn } from "@/shared/libs/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import type { LatestPost } from "./latest-post";


export default function HeroSection({ latestPost }: { latestPost?: LatestPost | null }) {

    // Falls back to the blog index when the API is unavailable.
    const latestBlogHref = latestPost ? `/posts/${encodeURIComponent(latestPost.slug)}` : `/posts`;
    const latestBlogLabel = latestPost?.title ?? 'New Blog';
    const latestBlogAria = latestPost ? `New blog post: ${latestPost.title}` : 'New blog';

    const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise<HTMLImageElement>(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = src;
        });

    const renderCanvas = useCallback((canvas: HTMLCanvasElement | null): void => {
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 360;
        canvas.height = 360;

        Promise.all([
            loadImage('/assets/gallery/WEBP/IMG_1915.webp'),
            loadImage('/assets/masks/mask.png')
        ]).then(([img, mask]) => {
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(mask, 0, 0, 350, 350);
        });
    }, []);


    return (
        <section id="hero" className="w-full pt-20 xl:pt-48 p-5 flex items-center min-h-screen justify-center mx-auto h-full overflow-x-hidden relative">
            <h1 className="sr-only">{appName}</h1>
            <p className="sr-only">{appDescriptions}</p>

            <div className="flex max-w-5xl justify-center mx-auto lg:-translate-y-20 max-md:justify-start z-20 flex-col lg:flex-row md:h-full items-center gap-4" aria-label="Introduction">
                <div className="px-2 sm:p-10 w-full max-w-3xl">
                    <BlurFade delay={0.1} inView>
                        <div className="mb-2 flex justify-center md:justify-start">
                            <Link href={latestBlogHref} aria-label={latestBlogAria} className="group inline-flex">
                                <Badge variant="outline" className="max-w-[min(90vw,42rem)] rounded-full hover:border bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/15" title={latestBlogLabel} >
                                    <span className="flex min-w-0 items-center gap-2">
                                        <span className="relative flex size-2 shrink-0">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                                            <span className="relative inline-flex size-2 rounded-full bg-primary" />
                                        </span>
                                        <span className="shrink-0">New </span>
                                        <span className="text-primary/60">|</span>
                                        <span className="truncate text-foreground">{latestBlogLabel}</span>
                                        <span className="ml-1 inline-flex w-0 overflow-hidden transition-[width] duration-200 group-hover:w-4">
                                            <ArrowRight className="h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                                        </span>
                                    </span>
                                </Badge>
                            </Link>
                        </div>
                    </BlurFade>
                    <BlurFade delay={0.15} inView>
                        <div className="text-3xl text-center md:text-left md:text-6xl font-bold">
                            <div className="relative mx-auto inline-block w-max filter-[drop-shadow(0px_1px_3px_rgba(27,37,80,0.14))]">
                                <div className="relative bg-clip-text text-transparent bg-no-repeat bg-linear-to-r from-sky-500 via-teal-500 to-green-500 py-4 [text-rendering:optimizeLegibility]">
                                    <span className="mr-2 -ml-0.5 font-sans [font-display:swap]">{`Hi I'm`}</span>
                                </div>
                            </div>
                            <Cover>{appName}</Cover>
                        </div>
                    </BlurFade>
                    <div className="max-md:text-xl text-2xl text-center h-fit md:text-left font-semibold">
                        <FlipWords words={appPositions} />
                    </div>

                    <BlurFade delay={0.50} inView className="mt-10 relative flex text-foreground/90 flex-col gap-4 text-center max-w-full md:text-left">
                        {appDescriptions.split('\n\n').map((description, index) => (
                            <p key={index} dangerouslySetInnerHTML={{ __html: description }} />
                        ))}
                    </BlurFade>

                    <BlurFade delay={0.60} inView>
                        <Skills />
                    </BlurFade>

                    <BlurFade delay={0.70} inView>
                        <div className="flex flex-col z-50 justify-center sm:justify-start sm:flex-row items-center gap-4 mt-6 max-md:px-3">
                            <MagneticArea>
                                <ThemeToggle />
                            </MagneticArea>
                        </div>
                    </BlurFade>
                </div>

                <BlurFade delay={0.25} inView className={cn("order-first relative mt-10 lg:min-h-72 min-w-72 sm:mt-0 shrink-0 lg:order-last flex max-md:w-40 mx-auto flex-col items-center justify-center")}>
                    <MagneticArea className="max-sm:w-56 w-72 aspect-square relative">
                        <canvas ref={renderCanvas} className="h-full w-full bg-center m-1" />
                        <RainbowEffects className="opacity-20" />
                    </MagneticArea>
                </BlurFade>
            </div>
        </section>
    )
}