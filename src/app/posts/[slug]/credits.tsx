import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import type { IArticle, IPerson } from '@/shared/interfaces/articles';
import { authorAvatar, authorHref } from '@/shared/libs/author';

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

function PersonAvatar({ name, src, className }: { name: string; src?: string; className: string }) {
    return (
        <Avatar className={className}>
            <AvatarImage src={src} alt={name} referrerPolicy='no-referrer' />
            <AvatarFallback>
                <User className='size-4' />
            </AvatarFallback>
        </Avatar>
    );
}

/**
 * Who wrote the post. Author profiles (attached by an admin) win; a member's
 * own post has none, so its owner is credited instead. Contributors (people
 * invited to help) follow, never repeating whoever is already credited.
 */
export function Credits({ article }: { article: IArticle }) {
    const authors = article.authors ?? [];
    const owner = authors.length === 0 && article.owner?.name ? article.owner : null;
    const contributors = (article.contributors ?? []).filter(
        (c): c is IPerson & { name: string } => !!c.name && c.id !== article.owner?.id,
    );
    if (!authors.length && !owner && !contributors.length) return null;

    return (
        <div className='flex flex-wrap items-center gap-x-5 gap-y-3'>
            {authors.length > 0 && (
                <ul className='flex flex-wrap items-center gap-x-5 gap-y-2' aria-label='Authors'>
                    {authors.map((author, index) => {
                        const href = authorHref(author);
                        const content = (
                            <>
                                <PersonAvatar name={author.name} src={authorAvatar(author)} className='size-8 ring-1 ring-foreground/10' />
                                <span className='font-medium text-foreground transition-colors group-hover:text-primary'>{author.name}</span>
                            </>
                        );
                        return (
                            <li key={index}>
                                {href ? (
                                    <a
                                        href={href}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        title={`View ${author.name}'s profile`}
                                        className='group flex items-center gap-2 rounded-full pr-2 transition-colors hover:bg-primary/10'
                                    >
                                        {content}
                                    </a>
                                ) : (
                                    <span className='flex items-center gap-2'>{content}</span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {owner && (
                <span className='flex items-center gap-2' aria-label='Author'>
                    <PersonAvatar name={owner.name!} src={safeAvatar(owner.avatar)} className='size-8 ring-1 ring-foreground/10' />
                    <span className='font-medium text-foreground'>{owner.name}</span>
                </span>
            )}

            {contributors.length > 0 && (
                <div className='flex items-center gap-2' aria-label='Contributors'>
                    <span className='text-foreground/50'>with</span>
                    <ul className='flex -space-x-2'>
                        {contributors.map((c) => (
                            <li key={c.id} title={c.name}>
                                <PersonAvatar name={c.name} src={safeAvatar(c.avatar)} className='size-7 ring-2 ring-background' />
                            </li>
                        ))}
                    </ul>
                    <span className='text-foreground/70'>
                        {contributors.length <= 2
                            ? contributors.map((c) => c.name).join(' and ')
                            : `${contributors[0].name} and ${contributors.length - 1} others`}
                    </span>
                </div>
            )}
        </div>
    );
}
