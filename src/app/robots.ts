import type { MetadataRoute } from 'next/types';
import { SITE_URL } from '@/shared/seo/site';

// Always advertise the production domain, not the request host (which would
// leak *.pages.dev preview hosts into robots.txt).
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/admin/', '/login'],
            },
        ],
        sitemap: `${SITE_URL}/sitemap-index.xml`,
        host: SITE_URL,
    };
}
