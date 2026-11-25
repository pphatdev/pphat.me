"use client";

import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useInGallery } from './gallery-context';

interface MarkdownImageProps {
    src?: string;
    alt?: string;
    className?: string;
    fallbackSrc?: string;
}

const DEFAULT_FALLBACK_SRC = '/assets/placeholder/placeholder.svg';

export function MarkdownImage({ src, alt, className, fallbackSrc = DEFAULT_FALLBACK_SRC }: MarkdownImageProps) {
    const pathname = usePathname();
    const inGallery = useInGallery();
    const [currentSrc, setCurrentSrc] = React.useState(src || fallbackSrc);
    const assetApiPath = React.useMemo(() => {
        const [section] = pathname.split('/').filter(Boolean);
        return section === 'projects' ? '/api/project' : '/api/post';
    }, [pathname]);

    const currentSlug = React.useMemo(() => {
        const segments = pathname.split('/').filter(Boolean);
        return segments[segments.length - 1] || '';
    }, [pathname]);

    const resolveImageSrc = React.useCallback((value?: string) => {
        if (!value) {
            return fallbackSrc;
        }

        const trimmed = value.trim();
        if (
            trimmed.startsWith('http://')
            || trimmed.startsWith('https://')
            || trimmed.startsWith('//')
            || trimmed.startsWith('/')
            || trimmed.startsWith('data:')
            || trimmed.startsWith('blob:')
        ) {
            return trimmed;
        }

        if (!currentSlug) {
            return trimmed;
        }

        const asset = trimmed.replace(/^\.\//, '');
        return `${assetApiPath}?slug=${encodeURIComponent(currentSlug)}&asset=${encodeURIComponent(asset)}`;
    }, [assetApiPath, currentSlug, fallbackSrc]);

    React.useEffect(() => {
        setCurrentSrc(resolveImageSrc(src));
    }, [src, resolveImageSrc]);

    const handleError = () => {
        if (currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
        }
    };

    return (
        <Image
            src={currentSrc}
            alt={alt || 'Image'}
            width={800}
            height={450}
            onError={handleError}
            loading="lazy"
            unoptimized
            className={[
                inGallery
                    ? 'm-0! block w-full h-auto'
                    // Cap tall (portrait) photos at 70% of the viewport; width follows the
                    // aspect ratio and the frame hugs the image, centred in the column.
                    : 'mx-auto block h-auto max-h-[70vh] w-auto max-w-full object-contain sm:p-2 border border-foreground/10 mt-0! rounded-3xl!',
                className,
            ].filter(Boolean).join(' ')}
        />
    );
}