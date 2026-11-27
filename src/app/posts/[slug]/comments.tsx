'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageSquareReply, Trash2 } from 'lucide-react';
import { Textarea } from '@/shared/components/ui/textarea';
import { setReader, useReader, type Reader } from '@/shared/hooks/use-reader';

interface Comment {
    id: number;
    userId: string | null;
    parentId: number | null;
    authorName: string;
    content: string;
    createdAt: string;
}

/** A top-level comment with its replies (oldest first). */
interface Thread extends Comment {
    replies: Comment[];
}

interface Page {
    data: Thread[];
    pagination: { page: number; totalPages: number; total: number };
}

type PostResult = { ok: true; comment: Comment } | { ok: false; error: string };

const MAX_LENGTH = 5000;
const PAGE_SIZE = 20;

/** Comment threads for a post. Content is rendered as plain text (never HTML). */
export function Comments({ slug }: { slug: string }) {
    const { reader } = useReader();
    const pathname = usePathname();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const base = `/api/posts/${encodeURIComponent(slug)}/comments`;
    const loginHref = `/login?next=${encodeURIComponent(pathname)}`;

    const applyPage = useCallback((body: Page | null, pageNumber: number) => {
        setLoading(false);
        if (!body) return;
        const data = body.data.map((t) => ({ ...t, replies: t.replies ?? [] }));
        setThreads((prev) => (pageNumber === 1 ? data : [...prev, ...data]));
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

    /** POST a comment or reply; on 401 the session is gone, so sign the reader out locally. */
    const send = async (content: string, parentId?: number): Promise<PostResult> => {
        const res = await fetch(base, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parentId ? { content, parentId } : { content }),
        }).catch(() => null);
        if (res?.status === 401) {
            setReader(null);
            return { ok: false, error: 'Your session expired. Please sign in again.' };
        }
        if (!res?.ok) {
            const body = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
            return { ok: false, error: body?.error ?? 'Could not post your comment.' };
        }
        return { ok: true, comment: (await res.json()) as Comment };
    };

    const addThread = (comment: Comment) => {
        setThreads((prev) => [{ ...comment, replies: [] }, ...prev]);
        setTotal((t) => t + 1);
    };

    const addReply = (comment: Comment) => {
        setThreads((prev) =>
            prev.map((t) => (t.id === comment.parentId ? { ...t, replies: [...t.replies, comment] } : t)),
        );
        setReplyingTo(null);
    };

    const remove = async (comment: Comment) => {
        const prompt = comment.parentId ? 'Delete this reply?' : 'Delete this comment and its replies?';
        if (!confirm(prompt)) return;
        const res = await fetch(`${base}/${comment.id}`, { method: 'DELETE' }).catch(() => null);
        if (!res?.ok) return;
        if (comment.parentId) {
            setThreads((prev) =>
                prev.map((t) => (t.id === comment.parentId ? { ...t, replies: t.replies.filter((r) => r.id !== comment.id) } : t)),
            );
        } else {
            setThreads((prev) => prev.filter((t) => t.id !== comment.id));
            setTotal((t) => Math.max(0, t - 1));
        }
    };

    return (
        <section aria-labelledby="comments-heading" className="mt-12">
            <h2 id="comments-heading" className="text-lg font-semibold">
                Comments{total > 0 && <span className="ml-1 text-foreground/50">({total})</span>}
            </h2>

            {reader ? (
                <Composer
                    reader={reader}
                    className="mt-4"
                    placeholder="Share your thoughts…"
                    submitLabel="Post"
                    onSubmit={async (content) => {
                        const result = await send(content);
                        if (result.ok) addThread(result.comment);
                        return result;
                    }}
                />
            ) : (
                <p className="mt-4 rounded-xl border border-foreground/10 p-4 text-sm text-foreground/70">
                    <Link href={loginHref} className="font-medium text-primary hover:underline">
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
                {threads.map((thread) => (
                    <li key={thread.id} className="rounded-xl border border-foreground/10 p-4">
                        <CommentBody
                            comment={thread}
                            canDelete={!!reader && thread.userId === reader.id}
                            onDelete={() => void remove(thread)}
                        />
                        <div className="mt-2">
                            {reader ? (
                                <button
                                    type="button"
                                    onClick={() => setReplyingTo(replyingTo === thread.id ? null : thread.id)}
                                    aria-expanded={replyingTo === thread.id}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-foreground/60 hover:text-primary"
                                >
                                    <MessageSquareReply className="size-3.5" /> Reply
                                </button>
                            ) : (
                                <Link href={loginHref} className="inline-flex items-center gap-1 text-xs font-medium text-foreground/60 hover:text-primary">
                                    <MessageSquareReply className="size-3.5" /> Sign in to reply
                                </Link>
                            )}
                        </div>

                        {(thread.replies.length > 0 || replyingTo === thread.id) && (
                            <div className="mt-3 grid gap-3 border-l-2 border-foreground/10 pl-4">
                                {thread.replies.map((reply) => (
                                    <CommentBody
                                        key={reply.id}
                                        comment={reply}
                                        canDelete={!!reader && reply.userId === reader.id}
                                        onDelete={() => void remove(reply)}
                                    />
                                ))}
                                {reader && replyingTo === thread.id && (
                                    <Composer
                                        reader={reader}
                                        autoFocus
                                        rows={2}
                                        placeholder={`Reply to ${thread.authorName}…`}
                                        submitLabel="Reply"
                                        onCancel={() => setReplyingTo(null)}
                                        onSubmit={async (content) => {
                                            const result = await send(content, thread.id);
                                            if (result.ok) addReply(result.comment);
                                            return result;
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {loading && <Loader2 className="mx-auto mt-4 size-5 animate-spin text-foreground/40" />}
            {!loading && threads.length === 0 && <p className="mt-6 text-sm text-foreground/50">No comments yet. Be the first.</p>}
            {!loading && page < totalPages && (
                <button type="button" onClick={loadMore} className="mt-4 text-sm font-medium text-primary hover:underline">
                    Load more
                </button>
            )}
        </section>
    );
}

function CommentBody({ comment, canDelete, onDelete }: { comment: Comment; canDelete: boolean; onDelete: () => void }) {
    return (
        <div>
            <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{comment.authorName}</span>
                <span className="flex items-center gap-2 text-xs text-foreground/50">
                    <time dateTime={comment.createdAt}>{formatDistanceToNow(new Date(comment.createdAt))} ago</time>
                    {canDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            aria-label={comment.parentId ? 'Delete reply' : 'Delete comment'}
                            className="hover:text-destructive"
                        >
                            <Trash2 className="size-3.5" />
                        </button>
                    )}
                </span>
            </div>
            <p className="mt-1.5 text-sm whitespace-pre-wrap break-words text-foreground/80">{comment.content}</p>
        </div>
    );
}

/** Text box for a new comment or a reply. Clears itself after a successful post. */
function Composer({
    reader,
    onSubmit,
    onCancel,
    placeholder,
    submitLabel,
    rows = 3,
    autoFocus,
    className,
}: {
    reader: Reader;
    onSubmit: (content: string) => Promise<PostResult>;
    onCancel?: () => void;
    placeholder: string;
    submitLabel: string;
    rows?: number;
    autoFocus?: boolean;
    className?: string;
}) {
    const [draft, setDraft] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const content = draft.trim();
        if (!content) return;
        setPosting(true);
        setError(null);
        const result = await onSubmit(content);
        setPosting(false);
        if (result.ok) setDraft('');
        else setError(result.error);
    };

    return (
        <form onSubmit={submit} className={`grid gap-2 ${className ?? ''}`}>
            <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={MAX_LENGTH}
                rows={rows}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="resize-y rounded-xl bg-transparent"
                aria-label={placeholder}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-between gap-2 text-xs text-foreground/50">
                <span className="truncate">
                    As {reader.name || reader.email} · {draft.length}/{MAX_LENGTH}
                </span>
                <span className="flex items-center gap-2">
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="h-9 rounded-full px-3 text-sm text-foreground/60 hover:text-foreground">
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={posting || !draft.trim()}
                        className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                        {posting && <Loader2 className="size-4 animate-spin" />} {submitLabel}
                    </button>
                </span>
            </div>
        </form>
    );
}
