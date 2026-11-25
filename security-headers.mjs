// @ts-check
/**
 * Security headers, defined once and applied in two places:
 *  - next.config.ts `headers()` → responses rendered by the worker
 *  - scripts/pages-postbuild.mjs → `_headers` for static assets that
 *    Cloudflare Pages serves without running the worker
 *
 * CSP note: Next's bootstrap and the next-themes init script are inline and
 * this site does not use nonces, so `script-src` needs 'unsafe-inline'. The
 * policy still blocks third-party scripts, plugins, framing, <base> hijacking
 * and cross-origin form posts. Moving to nonce-based CSP would require
 * dynamic rendering for every page.
 */

/** @param {{ dev?: boolean }} [options] */
export function contentSecurityPolicy({ dev = false } = {}) {
    const directives = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        // Article images and avatars can come from any HTTPS host.
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'media-src': ["'self'", 'https:'],
        // Gallery "download" fetches the (any-host) image URL.
        'connect-src': ["'self'", 'https:', ...(dev ? ['ws:', 'http:'] : [])],
        'worker-src': ["'self'", 'blob:'],
        'frame-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'manifest-src': ["'self'"],
    };
    const policy = Object.entries(directives)
        .map(([name, values]) => `${name} ${values.join(' ')}`)
        .join('; ');
    return dev ? policy : `${policy}; upgrade-insecure-requests`;
}

/** @param {{ dev?: boolean }} [options] */
export function securityHeaders({ dev = false } = {}) {
    return [
        { key: 'Content-Security-Policy', value: contentSecurityPolicy({ dev }) },
        // No includeSubDomains/preload: that would bind every *.pphat.me host
        // to HTTPS forever. Add them once every subdomain is confirmed HTTPS.
        ...(dev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]),
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
        },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    ];
}
