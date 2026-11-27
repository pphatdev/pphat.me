/**
 * Example interface for a User object
 */
export interface IListResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }
}

export type IBaseResponse<T, E = {}> = {
    data: T;
    navigation?: {
        next?: string;
        prev?: string;
    }
} & E;
/**
 * Optional per-item SEO field from the API. When absent, keywords fall back to
 * the item's tags (see src/shared/seo/content.ts). LLM text is not a field:
 * the API serves it as /<type>/<slug>/llms.txt (see src/shared/seo/llms.ts).
 */
export interface ISeoFields {
    /** Search keywords: an array, or one comma-separated string. */
    keywords?: string[] | string | null;
}
