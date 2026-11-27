'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/shared/libs/utils';
import { setReader, useReader } from '@/shared/hooks/use-reader';

const TYPES = [
    { type: 'like', emoji: '👍', label: 'Like' },
    { type: 'heart', emoji: '❤️', label: 'Love' },
    { type: 'fire', emoji: '🔥', label: 'Fire' },
    { type: 'clap', emoji: '👏', label: 'Clap' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
] as const;

type Counts = Record<string, number>;

/** The API doesn't return "my reactions", so remember them per browser. Server-side it's idempotent per reader. */
const mineKey = (slug: string) => `pp:reactions:${slug}`;
function loadMine(slug: string): Set<string> {
    try {
        return new Set(JSON.parse(localStorage.getItem(mineKey(slug)) ?? '[]') as string[]);
    } catch {
        return new Set();
    }
}
function saveMine(slug: string, mine: Set<string>) {
    try {
        localStorage.setItem(mineKey(slug), JSON.stringify([...mine]));
    } catch {
        // ignore
    }
}

export function Reactions({ slug }: { slug: string }) {
    const { reader } = useReader();
    const router = useRouter();
    const pathname = usePathname();
    const [counts, setCounts] = useState<Counts>({});
    const [mine, setMine] = useState<Set<string>>(new Set());
    const [pending, setPending] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/posts/${encodeURIComponent(slug)}/reactions`)
            .then((r) => (r.ok ? (r.json() as Promise<Array<{ type: string; count: number }>>) : []))
            .catch(() => [] as Array<{ type: string; count: number }>)
            .then((list) => {
                setCounts(Object.fromEntries(list.map((r) => [r.type, r.count])));
                setMine(loadMine(slug));
            });
    }, [slug]);

    const toggle = async (type: string) => {
        if (!reader) {
            router.push(`/login?next=${encodeURIComponent(pathname)}`);
            return;
        }
        const on = !mine.has(type);
        setPending(type);
        const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/reactions/${type}`, { method: on ? 'POST' : 'DELETE' }).catch(() => null);
        setPending(null);
        if (res?.status === 401) {
            setReader(null);
            router.push(`/login?next=${encodeURIComponent(pathname)}`);
            return;
        }
        if (!res?.ok) return;
        const updated = (await res.json().catch(() => null)) as { count?: number } | null;
        const next = new Set(mine);
        if (on) next.add(type);
        else next.delete(type);
        setMine(next);
        saveMine(slug, next);
        setCounts((c) => ({ ...c, [type]: typeof updated?.count === 'number' ? updated.count : Math.max(0, (c[type] ?? 0) + (on ? 1 : -1)) }));
    };

    return (
        <div className="flex flex-wrap gap-2" aria-label="Reactions">
            {TYPES.map(({ type, emoji, label }) => {
                const active = mine.has(type);
                return (
                    <button
                        key={type}
                        type="button"
                        onClick={() => void toggle(type)}
                        disabled={pending === type}
                        aria-pressed={active}
                        title={reader ? label : `Sign in to react: ${label}`}
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-60',
                            active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-foreground/10 hover:bg-foreground/5',
                        )}
                    >
                        <span aria-hidden>{emoji}</span>
                        <span className="tabular-nums">{counts[type] ?? 0}</span>
                        <span className="sr-only">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
