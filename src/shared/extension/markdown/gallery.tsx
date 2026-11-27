"use client";

import React from 'react';
import { cn } from '@/shared/libs/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, RotateCw, Download } from 'lucide-react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { InGalleryContext } from './gallery-context';

interface MarkdownGalleryProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    'data-columns'?: string;
    'data-captions'?: string;
    layout?: string;
}

function getColumnsClass(columnsValue?: string): string {
    const columns = Number(columnsValue);

    if (columns >= 4) {
        return 'sm:columns-2 lg:columns-4';
    }

    if (columns === 3) {
        return 'sm:columns-2 lg:columns-3';
    }

    return 'sm:columns-2';
}

export function MarkdownGallery({
    children,
    className,
    'data-columns': dataColumns,
    'data-captions': dataCaptions,
    layout,
}: MarkdownGalleryProps) {
    const pathname = usePathname();
    const assetApiPath = React.useMemo(() => {
        const [section] = pathname.split('/').filter(Boolean);
        return section === 'projects' ? '/api/project' : '/api/post';
    }, [pathname]);
    const [selectedImage, setSelectedImage] = React.useState<{ src: string; alt: string; } | null>(null);
    const [currentIndex, setCurrentIndex] = React.useState<number>(0);
    const [imageLoading, setImageLoading] = React.useState(false);
    const [rotation, setRotation] = React.useState<number>(0);
    const showCaptions = dataCaptions === 'true';
    const [loadedMap, setLoadedMap] = React.useState<Record<number, boolean>>({});
    const [snapIndex, setSnapIndex] = React.useState(0);
    const [scrollProgress, setScrollProgress] = React.useState(0);
    const isSnapLayout = layout === 'snap' || layout === 'snap-x';
    const snapScrollerRef = React.useRef<HTMLDivElement>(null);

    const currentSlug = React.useMemo(() => {
        const segments = pathname.split('/').filter(Boolean);
        return segments[segments.length - 1] || '';
    }, [pathname]);

    const resolveImageSrc = React.useCallback((value?: string) => {
        if (!value) {
            return value;
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
    }, [assetApiPath, currentSlug]);

    const markLoaded = React.useCallback((index: number) => {
        setLoadedMap((prev) => {
            if (prev[index]) {
                return prev;
            }
            return { ...prev, [index]: true };
        });
    }, []);
    const items = React.Children.toArray(children).filter((child) => {
        if (typeof child === 'string') {
            return child.trim().length > 0;
        }

        return React.isValidElement(child);
    });

    const getImageData = React.useCallback((item: React.ReactNode) => {
        if (React.isValidElement(item)) {
            // Check if it's an img element or has an img child
            const findImageProps = (element: any): { src?: string; alt?: string } | null => {
                if (element.type === 'img') {
                    return { src: resolveImageSrc(element.props.src), alt: element.props.alt };
                }
                if (element.props?.src) {
                    return { src: resolveImageSrc(element.props.src), alt: element.props.alt };
                }
                if (element.props?.children) {
                    const children = React.Children.toArray(element.props.children);
                    for (const child of children) {
                        if (React.isValidElement(child)) {
                            const result = findImageProps(child);
                            if (result) return result;
                        }
                    }
                }
                return null;
            };
            return findImageProps(item);
        }
        return null;
    }, [resolveImageSrc]);

    const removeWidthParam = (url: string): string => {
        try {
            const urlObj = new URL(url);
            urlObj.searchParams.set('w', '1000');
            urlObj.searchParams.set('width', '1000');
            return urlObj.toString();
        } catch {
            // If URL parsing fails, return original
            return url;
        }
    };

    const handleImageClick = React.useCallback((item: React.ReactNode, index: number) => {
        const imageData = getImageData(item);
        if (imageData?.src) {
            const cleanSrc = removeWidthParam(imageData.src);
            setImageLoading(true);
            setCurrentIndex(index);
            setRotation(0);
            setSelectedImage({ src: cleanSrc, alt: imageData.alt || 'Image' });
        }
    }, [getImageData]);

    const handleNext = React.useCallback(() => {
        const nextIndex = (currentIndex + 1) % items.length;
        setImageLoading(true);
        handleImageClick(items[nextIndex], nextIndex);
    }, [currentIndex, items, handleImageClick]);

    const handlePrev = React.useCallback(() => {
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        setImageLoading(true);
        handleImageClick(items[prevIndex], prevIndex);
    }, [currentIndex, items, handleImageClick]);

    const handleClose = () => {
        setSelectedImage(null);
        setImageLoading(false);
        setRotation(0);
    };

    const handleRotate = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleDownload = async () => {
        if (!selectedImage) return;

        try {
            const response = await fetch(selectedImage.src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = selectedImage.alt || 'image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    };

    const handleSnapScroll = React.useCallback((direction: 'prev' | 'next') => {
        const container = snapScrollerRef.current;
        if (!container) return;

        const nextTarget = direction === 'next'
            ? Math.min(snapIndex + 1, items.length - 1)
            : Math.max(snapIndex - 1, 0);

        const cards = container.querySelectorAll('figure');
        const targetCard = cards[nextTarget] as HTMLElement | undefined;
        if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
            setSnapIndex(nextTarget);
        }
    }, [snapIndex, items.length]);

    React.useEffect(() => {
        if (!isSnapLayout) {
            setScrollProgress(0);
            return;
        }
        const container = snapScrollerRef.current;
        if (!container) return;

        let rafId: number | null = null;
        const updateActiveIndex = () => {
            const cards = Array.from(container.querySelectorAll('figure')) as HTMLElement[];
            if (cards.length === 0) return;

            const nextProgress = container.scrollWidth === 0
                ? 100
                : Math.min(((container.scrollLeft + container.clientWidth) / container.scrollWidth) * 100, 100);
            setScrollProgress((prev) => (Math.abs(prev - nextProgress) < 0.1 ? prev : nextProgress));

            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.left + containerRect.width / 2;

            let nearestIndex = 0;
            let nearestDistance = Number.POSITIVE_INFINITY;

            cards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                const cardCenter = rect.left + rect.width / 2;
                const distance = Math.abs(cardCenter - containerCenter);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = index;
                }
            });

            setSnapIndex((prev) => (prev === nearestIndex ? prev : nearestIndex));
        };

        const onScroll = () => {
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
            }
            rafId = window.requestAnimationFrame(updateActiveIndex);
        };

        updateActiveIndex();
        container.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        return () => {
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
            }
            container.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [isSnapLayout, items.length]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'r' || e.key === 'R') handleRotate();
        };
        if (selectedImage) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [selectedImage, currentIndex, handleNext, handlePrev]);

    const snapProgress = Math.max(0, Math.min(scrollProgress, 100));

    return (
        <>
            <div className="relative">
                {isSnapLayout && items.length > 1 && (
                    <div className="mb-3 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => handleSnapScroll('prev')}
                            className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-background/70 px-3 py-1.5 text-sm transition-colors hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-40"
                            aria-label="Scroll gallery previous"
                            disabled={snapIndex === 0}
                        >
                            <ChevronLeft className="size-4" />
                            Prev
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSnapScroll('next')}
                            className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-background/70 px-3 py-1.5 text-sm transition-colors hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-40"
                            aria-label="Scroll gallery next"
                            disabled={snapProgress >= 99.5}
                        >
                            Next
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                )}

                <div
                    ref={snapScrollerRef}
                    className={cn(
                        isSnapLayout
                            ? 'not-prose flex flex-row gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none'
                            : cn('not-prose my-8 columns-2 gap-x-3 md:gap-x-4', getColumnsClass(dataColumns)),
                        className
                    )}
                >
                    {items.map((item, index) => {
                        const caption = React.isValidElement<{ alt?: string }>(item)
                            ? item.props.alt
                            : undefined;

                        return (
                            <motion.figure
                                key={`gallery-item-${index}`}
                                className={cn(
                                    'group m-0 cursor-pointer overflow-hidden rounded-2xl border border-foreground/10 bg-background/40 p-1 transition-colors hover:border-primary/40',
                                    isSnapLayout
                                        ? 'flex-none snap-start w-56 sm:w-64 md:w-72 [&_img]:h-44 [&_img]:object-cover'
                                        : 'mb-3 break-inside-avoid md:mb-4'
                                )}
                                initial={isSnapLayout ? { opacity: 0, x: 40 } : { opacity: 0, y: 50 }}
                                whileInView={isSnapLayout ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: isSnapLayout ? '-60px' : '-100px' }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.1,
                                    ease: [0.25, 0.1, 0.25, 1]
                                }}
                                onClick={() => handleImageClick(item, index)}
                            >
                                <div className={cn('relative overflow-hidden rounded-xl', isSnapLayout ? 'h-44' : 'min-h-24')}>
                                    {!loadedMap[index] && (
                                        <div className="absolute inset-0 animate-pulse bg-muted/60" />
                                    )}
                                    <div
                                        className={cn(
                                            'transition-[opacity,transform] duration-500 group-hover:scale-[1.03]',
                                            loadedMap[index] ? 'opacity-100' : 'opacity-0'
                                        )}
                                        ref={(el) => {
                                            if (!el) return;
                                            const img = el.querySelector('img');
                                            if (img?.complete) markLoaded(index);
                                        }}
                                        onLoad={() => markLoaded(index)}
                                    >
                                        <InGalleryContext.Provider value>{item}</InGalleryContext.Provider>
                                    </div>
                                </div>
                                {showCaptions && caption ? (
                                    <figcaption className="text-muted-foreground line-clamp-2 px-2 pt-2 pb-1 text-sm">
                                        {caption}
                                    </figcaption>
                                ) : null}
                            </motion.figure>
                        );
                    })}
                </div>

                {isSnapLayout && items.length > 1 && (
                    <div
                        className="mt-1 h-1 w-full overflow-hidden rounded-full bg-foreground/10"
                        role="progressbar"
                        aria-label="Gallery scroll position"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(snapProgress)}
                    >
                        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${snapProgress}%` }} />
                    </div>
                )}
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    >
                        {/* Top Controls */}
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload();
                                }}
                                className="p-2 rounded-full bg-background/20 hover:bg-background/30 transition-colors"
                                aria-label="Download image"
                            >
                                <Download className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRotate();
                                }}
                                className="p-2 rounded-full bg-background/20 hover:bg-background/30 transition-colors"
                                aria-label="Rotate image"
                            >
                                <RotateCw className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-full bg-background/20 hover:bg-background/30 transition-colors"
                                aria-label="Close preview"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        {/* Navigation Buttons */}
                        {items.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrev();
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-background/20 hover:bg-background/30 transition-colors"
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="w-6 h-6 text-white" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNext();
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-background/20 hover:bg-background/30 transition-colors"
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="w-6 h-6 text-white" />
                                </button>
                            </>
                        )}

                        <motion.div
                            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {imageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                </div>
                            )}
                            <Image
                                src={selectedImage.src}
                                alt={selectedImage.alt}
                                width={1920}
                                height={1080}
                                style={{
                                    transform: `rotate(${rotation}deg)`,
                                    transition: 'transform 0.3s ease-in-out'
                                }}
                                className={cn(
                                    "max-w-full max-h-full w-auto h-auto object-contain rounded-lg transition-opacity duration-300",
                                    imageLoading ? "opacity-0" : "opacity-100"
                                )}
                                unoptimized={selectedImage.src.startsWith('http')}
                                onLoad={() => setImageLoading(false)}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
