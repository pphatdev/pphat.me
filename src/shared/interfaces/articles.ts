export interface ITag {
    id: number;
    tag: string;
    description?: string;
}

export interface IAuthor {
    name: string;
    /** Headline, e.g. "Front-End Developer" (legacy rows may hold an avatar URL). */
    profile?: string;
    url?: string;
    avatarUrl?: string;
    socialLinks?: string[];
}

/** A user credited on a post (owner or contributor): public name and avatar only. */
export interface IPerson {
    id: string;
    name: string | null;
    avatar: string | null;
}

export interface IArticleStats {
    views: number;
    readingMins: number;
}

import { ISeoFields } from '.';

export interface IArticle extends ISeoFields {
    id: string;
    title: string;
    slug: string;
    description: string;
    tags: ITag[];
    authors: IAuthor[];
    thumbnail: string | null;
    published: boolean;
    ownerId: string;
    /** The account that created the post. */
    owner?: IPerson | null;
    /** People invited to help write it (detail responses only). */
    contributors?: IPerson[];
    createdAt: string;
    updatedAt: string;
    content: string;
    filePath?: string;
    stats?: IArticleStats;
}

export interface IPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface IArticleListResponse {
    data: IArticle[];
    pagination: IPagination;
}

export interface IArticleDetailResponse {
    data: IArticle;
    /** The API returns absolute URLs (`…/articles/<slug>`) for neighbours. */
    navigation?: {
        next: string | null;
        prev: string | null;
    };
}
