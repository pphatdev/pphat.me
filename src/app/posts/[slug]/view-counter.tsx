"use client";

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { APP_API } from '@/shared/libs/constants';

/** Time the post must be visible before it counts as a read. */
const READ_THRESHOLD_MS = 5_000;
const STORAGE_PREFIX = 'pphat:viewed:';

const formatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function alreadyCounted(slug: string): boolean {
    try {
        return sessionStorage.getItem(STORAGE_PREFIX + slug) === '1';
    } catch {
        return false; // storage disabled (private mode): just send; the API dedupes per day
    }
}

function markCounted(slug: string): void {
    try {
        sessionStorage.setItem(STORAGE_PREFIX + slug, '1');
    } catch {
        // ignore
    }
}

/**
 * Shows the post's view count and records a view once the reader has had the
 * page visible for READ_THRESHOLD_MS (time in a background tab does not
 * count). Sent at most once per browser session; the API also dedupes per
 * reader per day and ignores bots, so refreshes don't inflate the number.
 */
export function ViewCounter({ slug, initialViews }: { slug: string; initialViews: number }) {
    const [views, setViews] = useState(initialViews);

    useEffect(() => {
        if (!APP_API || alreadyCounted(slug)) return;

        let visibleMs = 0;
        let lastVisibleAt = document.visibilityState === 'visible' ? performance.now() : null;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let done = false;

        const send = async () => {
            if (done) return;
            done = true;
            markCounted(slug);
            try {
                const res = await fetch(
                    `${APP_API.replace(/\/$/, '')}/v1/api/articles/${encodeURIComponent(slug)}/stats/view`,
                    // keepalive: let the request finish even if the reader navigates away.
                    { method: 'POST', credentials: 'omit', keepalive: true },
                );
                if (!res.ok) return;
                const data = (await res.json()) as { views?: unknown };
                if (typeof data.views === 'number') setViews(data.views);
            } catch {
                // Network errors are non-fatal: the count just isn't refreshed.
            }
        };

        const schedule = () => {
            clearTimeout(timer);
            if (lastVisibleAt === null) return;
            timer = setTimeout(send, Math.max(0, READ_THRESHOLD_MS - visibleMs));
        };

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                lastVisibleAt = performance.now();
            } else if (lastVisibleAt !== null) {
                visibleMs += performance.now() - lastVisibleAt;
                lastVisibleAt = null;
            }
            schedule();
        };

        schedule();
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [slug]);

    return (
        <div
            className='flex items-center space-x-1 max-sm:text-xs text-sm text-foreground/50 whitespace-nowrap'
            title={`${views.toLocaleString()} ${views === 1 ? 'view' : 'views'}`}
        >
            <Eye className='w-4 h-4 text-primary/70' />
            <span>
                {formatter.format(views)} {views === 1 ? 'view' : 'views'}
            </span>
        </div>
    );
}
