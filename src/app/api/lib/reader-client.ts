/**
 * Calls to the upstream API on behalf of a signed-in reader.
 *
 * Unlike `upstream()` in ./client.ts (read-only, carries the site's API key),
 * this NEVER sends NEXT_PPHAT_API_KEY: it forwards the reader's own access
 * token, so the API enforces the reader's permissions. Writes are allowed, but
 * only to an explicit allowlist of reader endpoints, and the resolved path must
 * not change under URL normalisation (no traversal).
 */
import { BASE_URL } from './client';

const REACTION_TYPES = ['like', 'heart', 'fire', 'clap', 'wow'] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];

export function isReactionType(value: string): value is ReactionType {
    return (REACTION_TYPES as readonly string[]).includes(value);
}

const ALLOWED_PATHS: RegExp[] = [
    /^\/v1\/api\/auth\/email\/(login|register|verify)$/,
    /^\/v1\/api\/auth\/(refresh|me|logout)$/,
    /^\/v1\/api\/articles\/[^/]+\/comments(\/\d+)?$/,
    /^\/v1\/api\/articles\/[^/]+\/reactions$/,
    new RegExp(`^/v1/api/articles/[^/]+/reactions/(${REACTION_TYPES.join('|')})$`),
];

export class ReaderPathError extends Error {}

function resolve(path: string): URL {
    const url = new URL(`${BASE_URL}${path}`);
    const rawPath = path.split(/[?#]/, 1)[0]!;
    if (url.origin !== new URL(BASE_URL).origin || url.pathname !== rawPath || !ALLOWED_PATHS.some((re) => re.test(rawPath))) {
        throw new ReaderPathError(`Refusing reader request to ${path}`);
    }
    return url;
}

/**
 * @description Call an allowlisted API endpoint as the reader (or anonymously).
 * @param path e.g. `/v1/api/articles/${safeSegment(slug)}/comments`
 * @param init method, JSON body and optional access token
 */
export function readerFetch(
    path: string,
    init: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; accessToken?: string | null } = {},
): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (init.body !== undefined) headers['Content-Type'] = 'application/json';
    if (init.accessToken) headers.Authorization = `Bearer ${init.accessToken}`;
    return fetch(resolve(path), {
        method: init.method ?? 'GET',
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
}
