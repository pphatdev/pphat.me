'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { setReader, type Reader } from '@/shared/hooks/use-reader';
import { takeReturnPath } from '@/shared/components/auth/return-path';

const MESSAGES: Record<string, string> = {
    access_denied: 'You cancelled the sign-in.',
    invalid_state: 'The sign-in link expired. Please try again.',
};

/**
 * GitHub/Google return here with tokens in the URL fragment. They are removed
 * from the address bar immediately and handed to /api/auth/session, which
 * verifies them and stores them in HttpOnly cookies.
 */
// Read the fragment once. After history.replaceState() clears it from the
// address bar, keep returning the captured value (server snapshot: null).
let captured: string | null = null;
const subscribe = () => () => {};
function readHash(): string {
    const current = window.location.hash.slice(1);
    if (current) captured = current;
    return captured ?? '';
}

export default function AuthCallbackPage() {
    const router = useRouter();
    const hash = useSyncExternalStore(subscribe, readHash, () => null);
    const params = useMemo(() => new URLSearchParams(hash ?? ''), [hash]);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const [requestError, setRequestError] = useState<string | null>(null);

    // No token in the fragment: show why, derived during render.
    const fragmentError =
        hash !== null && !accessToken ? (MESSAGES[params.get('error') ?? ''] ?? 'Sign-in failed. Please try again.') : null;
    const error = fragmentError ?? requestError;

    useEffect(() => {
        if (hash === null) return;
        window.history.replaceState(null, '', window.location.pathname); // drop tokens from the URL
        if (!accessToken) return;
        void fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken, refreshToken }),
        })
            .then(async (res) => {
                const data = (await res.json().catch(() => ({}))) as { user?: Reader };
                if (!res.ok || !data.user) throw new Error();
                setReader(data.user);
                router.replace(takeReturnPath());
                router.refresh();
            })
            .catch(() => setRequestError('Sign-in failed. Please try again.'));
    }, [hash, accessToken, refreshToken, router]);

    return (
        <main className="flex min-h-svh items-center justify-center px-4">
            {error ? (
                <div className="text-center">
                    <p className="text-foreground/80">{error}</p>
                    <Link href="/login" className="mt-3 inline-block font-medium text-primary hover:underline">
                        Back to sign in
                    </Link>
                </div>
            ) : (
                <p className="flex items-center gap-2 text-foreground/60">
                    <Loader2 className="size-4 animate-spin" /> Signing you in…
                </p>
            )}
        </main>
    );
}
