import { Fragment } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import type { IArticle, IPerson } from '@/shared/interfaces/articles';
import { authorAvatar, authorHref } from '@/shared/libs/author';
import { cn } from '@/shared/libs/utils';

/** One credited person, whatever the source (author profile, owner, contributor). */
interface Credit {
    key: string;
    name: string;
    avatar?: string;
    href?: string;
}

/** Avatar URLs come from user profiles; only render http(s) ones. */
function safeAvatar(url: string | null | undefined): string | undefined {
    if (!url) return undefined;
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : undefined;
    } catch {
        return undefined;
    }
}

const initials = (name: string) =>
    name
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

/** Overlapping avatars, at most `max`, with a +N chip for the rest. */
function AvatarStack({ people, max = 3 }: { people: Credit[]; max?: number }) {
    const shown = people.slice(0, max);
    const rest = people.length - shown.length;
    return (
        <div className='flex -space-x-2'>
            {shown.map((p) => (
                <Avatar key={p.key} className='size-9 ring-2 ring-background'>
                    <AvatarImage src={p.avatar} alt='' referrerPolicy='no-referrer' />
                    <AvatarFallback className='bg-primary/10 text-xs font-semibold text-primary'>{initials(p.name)}</AvatarFallback>
                </Avatar>
            ))}
            {rest > 0 && (
                <span className='grid size-9 place-items-center rounded-full bg-muted text-xs font-medium text-foreground/70 ring-2 ring-background'>
                    +{rest}
                </span>
            )}
        </div>
    );
}

/** Names, linked where there's a profile, as "A, B and C". */
function Names({ people }: { people: Credit[] }) {
    return (
        <span className='truncate font-medium text-foreground'>
            {people.map((p, i) => (
                <Fragment key={p.key}>
                    {i > 0 && (i === people.length - 1 ? ' and ' : ', ')}
                    {p.href ? (
                        <a
                            href={p.href}
                            target='_blank'
                            rel='noopener noreferrer'
                            title={`View ${p.name}'s profile`}
                            className='transition-colors hover:text-primary'
                        >
                            {p.name}
                        </a>
                    ) : (
                        p.name
                    )}
                </Fragment>
            ))}
        </span>
    );
}

function CreditGroup({ label, people, className }: { label: string; people: Credit[]; className?: string }) {
    return (
        <div className={cn('flex min-w-0 items-center gap-3', className)} aria-label={label}>
            <AvatarStack people={people} />
            <div className='grid min-w-0 leading-tight'>
                <Names people={people} />
                <span className='text-xs text-foreground/50'>{label}</span>
            </div>
        </div>
    );
}

/**
 * Who wrote the post, as two groups split by a divider: the author (author
 * profiles attached by an admin, else the post's owner) and the
 * contributors invited to help. Contributors never repeat the owner.
 */
export function Credits({ article }: { article: IArticle }) {
    const authors: Credit[] = (article.authors ?? []).length
        ? article.authors.map((a, i) => ({ key: `a${i}`, name: a.name, avatar: authorAvatar(a), href: authorHref(a) ?? undefined }))
        : article.owner?.name
          ? [{ key: article.owner.id, name: article.owner.name, avatar: safeAvatar(article.owner.avatar) }]
          : [];
    const contributors: Credit[] = (article.contributors ?? [])
        .filter((c): c is IPerson & { name: string } => !!c.name && c.id !== article.owner?.id)
        .map((c) => ({ key: c.id, name: c.name, avatar: safeAvatar(c.avatar) }));
    if (!authors.length && !contributors.length) return null;

    return (
        <div className='flex flex-wrap items-center gap-x-5 gap-y-3'>
            {authors.length > 0 && <CreditGroup label={authors.length > 1 ? 'Authors' : 'Author'} people={authors} />}
            {authors.length > 0 && contributors.length > 0 && (
                <span aria-hidden className='h-9 w-px bg-foreground/15' />
            )}
            {contributors.length > 0 && (
                <CreditGroup label={contributors.length > 1 ? 'Contributors' : 'Contributor'} people={contributors} />
            )}
        </div>
    );
}
