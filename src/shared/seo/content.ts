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

/**
 * Parse an API timestamp. SQLite `datetime('now')` values ("2026-11-28 03:26:21")
 * carry no zone but are UTC; `new Date()` would read them as local time.
 */
export function parseApiDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(value) ? `${value.replace(' ', 'T')}Z` : value;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** ISO 8601 form of an API timestamp, for JSON-LD and Open Graph. */
export function isoDate(value: string | null | undefined): string | undefined {
    return parseApiDate(value)?.toISOString();
}
