import { appName } from '@/shared/data';

/**
 * Canonical site settings used for metadata, robots.txt, structured data and
 * the sitemap. Always the production domain, never the request host, so
 * preview deployments (*.pages.dev) don't advertise themselves as canonical.
 *
 * NEXT_PUBLIC_SITE_URL can override it (e.g. for a staging domain).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://pphat.me').replace(/\/$/, '');

export const SITE_NAME = appName;

export const SITE_TITLE = `${appName} | Senior Front-end Developer & UI/UX Designer`;

export const SITE_DESCRIPTION =
    'Portfolio and blog of LEAT Sophat (PPhat), a Senior Front-end Developer and UI/UX Designer from Phnom Penh, Cambodia. Projects, articles, and experience in React, Next.js, TypeScript, and Tailwind CSS.';

export const SITE_KEYWORDS = [
    'LEAT Sophat',
    'Leat Sophat',
    'PPhat',
    'pphatdev',
    'Front-end Developer',
    'UI/UX Designer',
    'Cambodia',
    'Phnom Penh',
    'React',
    'Next.js',
    'TypeScript',
    'Tailwind CSS',
    'Portfolio',
    'Blog',
];

/** Default social preview image (1920×1080 screenshot of the home page). */
export const SITE_OG_IMAGE = {
    url: '/assets/screenshots/home.png',
    width: 1920,
    height: 1080,
    alt: `${appName} — Senior Front-end Developer & UI/UX Designer`,
};

/**
 * Shared Open Graph fields. A page's `openGraph` replaces the layout's object
 * entirely (no deep merge), so pages spread this and add title/description/url.
 */
export const openGraphBase = {
    type: 'website' as const,
    locale: 'en_US',
    siteName: SITE_NAME,
    images: [SITE_OG_IMAGE],
};

export const SOCIAL_PROFILES = [
    'https://github.com/pphatdev',
    'https://www.linkedin.com/in/pphatdev',
    'https://x.com/pphatdev',
];

export const TWITTER_HANDLE = '@pphatdev';
