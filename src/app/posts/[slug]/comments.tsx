'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';
import { Textarea } from '@/shared/components/ui/textarea';
import { setReader, useReader } from '@/shared/hooks/use-reader';

interface Comment {
    id: number;
    userId: string | null;
    authorName: string;
    content: string;
    createdAt: string;
}

interface Page {
    data: Comment[];
    pagination: { page: number; totalPages: number; total: number };
}

const MAX_LENGTH = 5000;
const PAGE_SIZE = 20;

/** Comment thread for a post. Content is rendered as plain text (never HTML). */
export function Comments({ slug }: { slug: string }) {
    const { reader } = useReader();
    const pathname = usePathname();
    const [comments, setComments] = useState<Comment[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const base = `/api/posts/${encodeURIComponent(slug)}/comments`;

    const applyPage = useCallback((body: Page | null, pageNumber: number) => {
        setLoading(false);
        if (!body) return;
        setComments((prev) => (pageNumber === 1 ? body.data : [...prev, ...body.data]));
        setPage(body.pagination.page);
        setTotalPages(body.pagination.totalPages);
        setTotal(body.pagination.total);
    }, []);

    const fetchPage = useCallback(
        (pageNumber: number): Promise<Page | null> =>
            fetch(`${base}?page=${pageNumber}&limit=${PAGE_SIZE}`)
                .then((res) => (res.ok ? (res.json() as Promise<Page>) : null))
                .catch(() => null),
        [base],
    );

    useEffect(() => {
        void fetchPage(1).then((body) => applyPage(body, 1));
    }, [fetchPage, applyPage]);

    const loadMore = () => {
        setLoading(true);
        void fetchPage(page + 1).then((body) => applyPage(body, page + 1));
    };

    const post = async (event: React.FormEvent) => {
        event.preventDefault();
        const content = draft.trim();
        if (!content) return;
        setPosting(true);
        setError(null);
        const res = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }).catch(() => null);
        setPosting(false);
        if (res?.status === 401) {
            setReader(null);
            setError('Your session expired. Please sign in again.');
            return;
        }
        if (!res?.ok) {
            const body = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
            setError(body?.error ?? 'Could not post your comment.');
            return;
        }
        const created = (await res.json()) as Comment;
        setComments((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
        setDraft('');
    };

    const remove = async (id: number) => {
        if (!confirm('Delete this comment?')) return;
        const res = await fetch(`${base}/${id}`, { method: 'DELETE' }).catch(() => null);
        if (res?.ok) {
            setComments((prev) => prev.filter((c) => c.id !== id));
            setTotal((t) => Math.max(0, t - 1));
        }
    };

    return (
        <section aria-labelledby="comments-heading" className="mt-12">
            <h2 id="comments-heading" className="text-lg font-semibold">
                Comments{total > 0 && <span className="ml-1 text-foreground/50">({total})</span>}
            </h2>

            {reader ? (
                <form onSubmit={post} className="mt-4 grid gap-2">
                    <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        maxLength={MAX_LENGTH}
                        rows={3}
                        placeholder="Share your thoughts…"
                        className="resize-y rounded-xl bg-transparent"
                        aria-label="Write a comment"
                    />
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="flex items-center justify-between text-xs text-foreground/50">
                        <span>
                            Commenting as {reader.name || reader.email} · {draft.length}/{MAX_LENGTH}
                        </span>
                        <button
                            type="submit"
                            disabled={posting || !draft.trim()}
                            className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {posting && <Loader2 className="size-4 animate-spin" />} Post
                        </button>
                    </div>
                </form>
            ) : (
                <p className="mt-4 rounded-xl border border-foreground/10 p-4 text-sm text-foreground/70">
                    <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="font-medium text-primary hover:underline">
                        Sign in
                    </Link>{' '}
                    or{' '}
                    <Link href={`/register?next=${encodeURIComponent(pathname)}`} className="font-medium text-primary hover:underline">
                        create an account
                    </Link>{' '}
                    to join the conversation.
                </p>
            )}

            <ul className="mt-6 grid gap-4">
                {comments.map((c) => (
                    <li key={c.id} className="rounded-xl border border-foreground/10 p-4">
                        <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="font-medium">{c.authorName}</span>
                            <span className="flex items-center gap-2 text-xs text-foreground/50">
                                <time dateTime={c.createdAt}>{formatDistanceToNow(new Date(c.createdAt))} ago</time>
                                {reader && c.userId === reader.id && (
                                    <button type="button" onClick={() => void remove(c.id)} aria-label="Delete comment" className="hover:text-destructive">
                                        <Trash2 className="size-3.5" />
                                    </button>
                                )}
                            </span>
                        </div>
                        <p className="mt-2 text-sm whitespace-pre-wrap break-words text-foreground/80">{c.content}</p>
                    </li>
                ))}
            </ul>

            {loading && <Loader2 className="mx-auto mt-4 size-5 animate-spin text-foreground/40" />}
            {!loading && comments.length === 0 && <p className="mt-6 text-sm text-foreground/50">No comments yet. Be the first.</p>}
            {!loading && page < totalPages && (
                <button type="button" onClick={loadMore} className="mt-4 text-sm font-medium text-primary hover:underline">
                    Load more
                </button>
            )}
        </section>
    );
}
