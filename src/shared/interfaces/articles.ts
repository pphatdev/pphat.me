export interface ITag {
    id: number;
    tag: string;
    description?: string;
}

export interface IAuthor {
    name: string;
    profile?: string;
    url?: string;
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
