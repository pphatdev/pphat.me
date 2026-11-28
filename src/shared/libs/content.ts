const BASE_URL = (process.env.NEXT_PUBLIC_APP_API || 'https://api.pphat.me').replace(/\/$/, '');

export interface ContentItem {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    published: boolean;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    visitorCount: number;
}

export async function getAllPosts(): Promise<ContentItem[]> {
    try {
        const res = await fetch(`${BASE_URL}/v1/api/articles?limit=100`, {
            cache: 'no-store'
        });
        if (!res.ok) {
            console.error("Failed to fetch posts", res.status);
            return [];
        }
        const json = (await res.json()) as any;
        return json.data.map((post: any) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            thumbnail: post.thumbnail,
            published: post.published,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            tags: post.tags?.map((t: any) => t.tag) || [],
            visitorCount: 0 // Default to 0 since API doesn't provide it yet
        }));
    } catch (e: any) {
        if (e?.digest === 'HANGING_PROMISE_REJECTION' || e?.message?.includes('prerendering')) {
            throw e; // Let Next.js handle its internal prerendering abort
        }
        console.error("Error fetching posts:", e);
        return [];
    }
}

export async function getAllProjects(): Promise<ContentItem[]> {
    try {
        const res = await fetch(`${BASE_URL}/v1/api/projects?limit=100`, {
            cache: 'no-store'
        });
        if (!res.ok) {
            console.error("Failed to fetch projects", res.status);
            return [];
        }
        const json = (await res.json()) as any;
        return json.data.map((project: any) => ({
            id: project.id,
            title: project.title,
            slug: project.slug,
            thumbnail: project.thumbnail,
            published: project.published,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            tags: project.tags?.map((t: any) => t.tag) || [],
            visitorCount: 0 // Default to 0 since API doesn't provide it yet
        }));
    } catch (e: any) {
        if (e?.digest === 'HANGING_PROMISE_REJECTION' || e?.message?.includes('prerendering')) {
            throw e; // Let Next.js handle its internal prerendering abort
        }
        console.error("Error fetching projects:", e);
        return [];
    }
}

/**
 * Neighbour links from the API arrive as absolute URLs on the API origin
 * (`https://api…/projects/<slug>`); keep only the slug so the site can link
 * to its own route.
 */
export function slugFromNavigation(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
        const last = new URL(value).pathname.split('/').filter(Boolean).pop();
        return last ? decodeURIComponent(last) : null;
    } catch {
        return null;
    }
}
