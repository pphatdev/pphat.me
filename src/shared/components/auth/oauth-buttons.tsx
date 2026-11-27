'use client';

import GithubIcon from '@/shared/components/icons/github';
import { rememberReturnPath } from './return-path';

const API = (process.env.NEXT_PUBLIC_APP_API || 'https://api.pphat.me').replace(/\/$/, '');
const SITE = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');

/** OAuth start URL that asks the API to send the reader back to this site. */
function oauthUrl(provider: 'github' | 'google'): string {
    const origin = SITE || (typeof window !== 'undefined' ? window.location.origin : '');
    return `${API}/v1/api/auth/${provider}?return_to=${encodeURIComponent(`${origin}/auth/callback`)}`;
}

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
            <path
                fill="currentColor"
                d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.07-1.1-.16-1.6H12z"
            />
        </svg>
    );
}

const buttonClass =
    'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-foreground/10 text-sm font-medium transition-colors hover:bg-foreground/5';

/** GitHub / Google buttons. They both sign in and create the account on first use. */
export function OAuthButtons({ returnTo }: { returnTo: string }) {
    return (
        <div className="grid grid-cols-2 gap-2">
            <a href={oauthUrl('github')} onClick={() => rememberReturnPath(returnTo)} className={buttonClass}>
                <GithubIcon className="size-4" /> GitHub
            </a>
            <a href={oauthUrl('google')} onClick={() => rememberReturnPath(returnTo)} className={buttonClass}>
                <GoogleIcon /> Google
            </a>
        </div>
    );
}
