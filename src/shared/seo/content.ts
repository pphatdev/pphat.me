import { ISeoFields } from '@/shared/interfaces';

interface KeywordSource extends ISeoFields {
    tags?: { tag: string }[] | null;
}

/**
 * A post's or project's own keywords from the API (`keywords`), falling back
 * to its tag names. Accepts an array or one comma-separated string.
 */
export function itemKeywords(item: KeywordSource): string[] {
    const raw = item.keywords;
    const fromApi = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [];
    const cleaned = fromApi.map((k) => k.trim()).filter(Boolean);
    const keywords = cleaned.length ? cleaned : (item.tags ?? []).map((t) => t.tag?.trim()).filter(Boolean);
    return [...new Set(keywords)];
}
