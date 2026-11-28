import { appName, appPositions } from '@/shared/data';
import { SITE_DESCRIPTION, SITE_URL, SOCIAL_PROFILES } from './site';
import { isoDate } from './content';

/**
 * Site-wide JSON-LD: who the site is about (Person) and the site itself
 * (WebSite). Helps search engines show the name, role and profile links.
 */
export function SiteStructuredData() {
    const graph = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Person',
                '@id': `${SITE_URL}/#person`,
                name: appName,
                alternateName: ['Leat Sophat', 'PPhat', 'pphatdev'],
                url: SITE_URL,
                image: `${SITE_URL}/assets/avatars/hero.webp`,
                jobTitle: appPositions[0].replace(/\.$/, ''),
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: 'Phnom Penh',
                    addressCountry: 'KH',
                },
                sameAs: SOCIAL_PROFILES,
            },
            {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                url: SITE_URL,
                name: appName,
                description: SITE_DESCRIPTION,
                inLanguage: 'en',
                publisher: { '@id': `${SITE_URL}/#person` },
            },
        ],
    };

    return <JsonLd data={graph} />;
}

/** Render any JSON-LD object; "<" is escaped so content can't close the tag. */
export function JsonLd({ data }: { data: object }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
        />
    );
}

/** Resolve a possibly relative URL against the canonical site. */
export function absoluteUrl(value: string): string {
    try {
        return new URL(value, `${SITE_URL}/`).toString();
    } catch {
        return SITE_URL;
    }
}

interface PostLike {
    title: string;
    slug: string;
    description?: string | null;
    thumbnail?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    content?: string | null;
    tags?: { tag: string }[] | null;
    authors?: { name: string; url?: string }[] | null;
    owner?: { name: string | null } | null;
    stats?: { readingMins?: number } | null;
}

/**
 * BlogPosting + BreadcrumbList for a post page. Lets search engines show the
 * headline, date, author and image, and the Home › Blog › Post trail.
 */
export function postStructuredData(post: PostLike, keywords: string[]) {
    const url = `${SITE_URL}/posts/${encodeURIComponent(post.slug)}`;
    const authors = post.authors?.length
        ? post.authors.map((a) => ({ '@type': 'Person', name: a.name, ...(a.url ? { url: a.url } : {}) }))
        : post.owner?.name
            ? [{ '@type': 'Person', name: post.owner.name }]
            : [{ '@id': `${SITE_URL}/#person` }];
    const words = post.content ? post.content.trim().split(/\s+/).filter(Boolean).length : undefined;

    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BlogPosting',
                '@id': `${url}#article`,
                mainEntityOfPage: { '@type': 'WebPage', '@id': url },
                url,
                headline: post.title.slice(0, 110),
                description: post.description || undefined,
                image: [absoluteUrl(post.thumbnail || '/assets/screenshots/home.png')],
                datePublished: isoDate(post.createdAt),
                dateModified: isoDate(post.updatedAt) ?? isoDate(post.createdAt),
                author: authors,
                publisher: { '@id': `${SITE_URL}/#person` },
                isPartOf: { '@id': `${SITE_URL}/#website` },
                inLanguage: 'en',
                keywords: keywords.length ? keywords.join(', ') : undefined,
                articleSection: post.tags?.[0]?.tag || undefined,
                wordCount: words,
                timeRequired: post.stats?.readingMins ? `PT${post.stats.readingMins}M` : undefined,
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/posts` },
                    { '@type': 'ListItem', position: 3, name: post.title, item: url },
                ],
            },
        ],
    };
}
