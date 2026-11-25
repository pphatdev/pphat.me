"use client";

import { cn } from "@/shared/libs/utils";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Avatar {
    imageUrl?: string | null;
    profileUrl?: string | null;
    title?: string;
}

interface AvatarCirclesProps {
    className?: string;
    numPeople?: number;
    /** Maximum avatars to render; the rest are summarised by `numPeople`. */
    max?: number;
    avatarUrls?: Avatar[];
}

function initials(name?: string): string {
    const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
    return (parts.slice(0, 2).map((p) => p[0]).join("") || "?").toUpperCase();
}

const CIRCLE = "relative hover:z-50 transition-all hover:scale-110 h-10 w-10";

function AvatarFace({ avatar }: { avatar: Avatar }) {
    const src = avatar.imageUrl?.trim();
    return (
        <div className={CIRCLE}>
            {src ? (
                <Image
                    className="rounded-full object-cover max-sm:rounded-none border-2 border-foreground/10"
                    src={src}
                    fill
                    sizes="40px"
                    alt={`Avatar ${avatar.title ?? ''}`}
                />
            ) : (
                // No image: render initials instead of an <img src=""> (which
                // makes the browser re-request the current page).
                <div
                    role="img"
                    aria-label={`Avatar ${avatar.title ?? ''}`}
                    className="flex size-full items-center justify-center rounded-full max-sm:rounded-none border-2 border-foreground/10 bg-muted text-xs font-medium text-foreground/80"
                >
                    {initials(avatar.title)}
                </div>
            )}
        </div>
    );
}

const AvatarCircles: React.FC<AvatarCirclesProps> = ({
    numPeople,
    className,
    max = 4,
    avatarUrls = [],
}: AvatarCirclesProps) => {
    return (
        <div className={cn("z-10 flex  max-sm:space-x-1 -space-x-6 rtl:space-x-reverse", className)}>
            {avatarUrls.slice(0, max).map((avatar, index) => {
                const href = avatar.profileUrl?.trim();
                return href && href !== '#' ? (
                    <Link
                        key={index}
                        href={href}
                        target="_blank"
                        title={avatar.title}
                        rel="noopener noreferrer"
                    >
                        <AvatarFace avatar={avatar} />
                    </Link>
                ) : (
                    <span key={index} title={avatar.title}>
                        <AvatarFace avatar={avatar} />
                    </span>
                );
            })}
            {(numPeople ?? 0) > 0 && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground/10 bg-background text-center text-xs font-medium text-background/80 ring-foreground/10 transition-all hover:scale-110 hover:bg-primary/50 hover:text-background">
                    +{numPeople}
                </div>
            )}
        </div>
    );
};

export default AvatarCircles;
