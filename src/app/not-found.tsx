import { BlurFade } from '@/shared/components/background/blur-fade';
import { GridPattern } from '@/shared/components/background/grid-pattern';
import { Badge } from '@/shared/components/ui/badge';
import { FlipWords } from '@/shared/components/ui/flip-words';
import MagneticArea from '@/shared/components/ui/magnetic-area';
import { ArrowRight } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: `404 - Page Not Found`,
    description: 'The page you were looking for does not exist or has been moved.',
    // Never index error pages.
    robots: { index: false, follow: true },
};

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-5">
            <div className="absolute inset-0 pointer-events-none -translate-y-25" aria-hidden="true">
                <GridPattern
                    width={30}
                    height={30}
                    strokeDasharray={"4 2"}
                    className={"mask-[radial-gradient(300px_circle_at_center,white,transparent)] absolute w-full"}
                />
            </div>

            <BlurFade className='flex flex-col items-center'>
                <h1 className="text-4xl lg:text-6xl flex items-center gap-2 font-bold mb-4">
                    <FlipWords words={["404"]} />
                    <span className="relative flex size-6 shrink-0 mr-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
                        <span className="relative inline-flex size-6 rounded-full bg-destructive" />
                    </span>
                    <FlipWords words={["Page Not Found"]} />
                </h1>
                <p className="mb-6">The page you are looking for does not exist or has been moved.</p>
            </BlurFade>

            <BlurFade delay={0.5} className='flex flex-col items-center'>
                <MagneticArea>
                    <Link href={'/'} aria-label={'Return Home'} className="group inline-flex mt-4">
                        <Badge variant="outline" className="max-w-[min(90vw,42rem)] rounded-full hover:border bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15" title={"Return Home"} >
                            <span className="flex min-w-0 items-center gap-2">
                                <span className="relative flex size-2 shrink-0">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                                </span>
                                <span className="truncate text-foreground">Return Home</span>
                                <span className="ml-1 inline-flex w-0 overflow-hidden transition-[width] duration-200 group-hover:w-4">
                                    <ArrowRight className="h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                                </span>
                            </span>
                        </Badge>
                    </Link>
                </MagneticArea>
            </BlurFade>

        </div>
    );
}
