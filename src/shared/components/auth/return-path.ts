/** Only same-site relative paths: never `//evil.example` or absolute URLs. */
export function safeReturnPath(value: string | null | undefined): string {
    return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/';
}

const KEY = 'pp:return-to';

/** Remember where to come back to across the GitHub/Google round trip. */
export function rememberReturnPath(path: string) {
    try {
        sessionStorage.setItem(KEY, safeReturnPath(path));
    } catch {
        // storage disabled: fall back to the home page
    }
}

export function takeReturnPath(): string {
    try {
        const value = sessionStorage.getItem(KEY);
        sessionStorage.removeItem(KEY);
        return safeReturnPath(value);
    } catch {
        return '/';
    }
}
