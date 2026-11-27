/**
 * Author display helpers shared by post pages, project pages and cards.
 *
 * `profile` is the author's headline ("Front-End Developer"). Older data stored
 * the avatar image URL there (https://github.com/<user>.png) until the API's
 * 0035_author_profile_headline migration moved it to `avatarUrl`; the legacy
 * fallback below keeps the blog correct whichever side deploys first.
 */

export interface AuthorLike {
    name: string;
    profile?: string | null;
    url?: string | null;
    avatarUrl?: string | null;
    socialLinks?: string[] | null;
}

function httpUrl(value: string | null | undefined): URL | null {
    if (!value) return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
    } catch {
        return null;
    }
}

/** GitHub username from a `https://github.com/<user>[.png]` URL. */
function githubUser(url: URL | null): string | null {
    if (!url || url.hostname !== 'github.com') return null;
    return /^\/([A-Za-z0-9-]+)(?:\.png)?\/?$/.exec(url.pathname)?.[1] ?? null;
}

/**
 * @description Avatar image URL: `avatarUrl`, else a legacy URL stored in `profile`.
 * @param { AuthorLike } author The author
 * @returns { string | undefined }
 */
export function authorAvatar(author: AuthorLike): string | undefined {
    return httpUrl(author.avatarUrl)?.toString() ?? httpUrl(author.profile)?.toString() ?? undefined;
}

/**
 * @description Headline text (`profile`), or undefined when it holds a legacy URL.
 * @param { AuthorLike } author The author
 * @returns { string | undefined }
 */
export function authorHeadline(author: AuthorLike): string | undefined {
    const value = author.profile?.trim();
    return value && !httpUrl(value) ? value : undefined;
}

/**
 * @description Where the author's name/avatar should link: their own `url`, else
 * their GitHub profile from `socialLinks`, else GitHub derived from a
 * `github.com/<user>.png` avatar. Null when none is available (render no link).
 * @param { AuthorLike } author The author
 * @returns { string | null }
 */
export function authorHref(author: AuthorLike): string | null {
    const own = httpUrl(author.url);
    if (own) return own.toString();

    for (const link of author.socialLinks ?? []) {
        const user = githubUser(httpUrl(link));
        if (user) return `https://github.com/${user}`;
    }

    const user = githubUser(httpUrl(author.avatarUrl)) ?? githubUser(httpUrl(author.profile));
    return user ? `https://github.com/${user}` : null;
}
