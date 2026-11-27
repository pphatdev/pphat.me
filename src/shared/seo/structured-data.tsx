import { appName, appPositions } from '@/shared/data';
import { SITE_DESCRIPTION, SITE_URL, SOCIAL_PROFILES } from './site';

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

    return (
        <script
            type="application/ld+json"
            // JSON.stringify output only; escape "<" so content can't close the tag.
            dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\\u003c') }}
        />
    );
}
