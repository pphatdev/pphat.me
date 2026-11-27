'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { setReader, type Reader } from '@/shared/hooks/use-reader';
import { OAuthButtons } from './oauth-buttons';
import { safeReturnPath } from './return-path';

type Mode = 'login' | 'register';
const MIN_PASSWORD = 8;

async function post<T>(url: string, body: unknown): Promise<{ ok: boolean; data: T & { error?: string } }> {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    return { ok: res.ok, data };
}

/** Email sign-in / registration with the emailed 6-digit code step, plus GitHub/Google. */
export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
    const router = useRouter();
    const returnTo = safeReturnPath(next);
    const [step, setStep] = useState<'form' | 'code'>('form');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const signedIn = (user: Reader) => {
        setReader(user);
        router.replace(returnTo);
        router.refresh();
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        if (mode === 'register') {
            if (!name.trim()) return setError('Enter your name.');
            if (password.length < MIN_PASSWORD) return setError(`Password must be at least ${MIN_PASSWORD} characters.`);
        }
        setBusy(true);
        try {
            if (mode === 'register') {
                const { ok, data } = await post('/api/auth/register', { name, email, password });
                if (!ok) return setError(data.error ?? 'Could not create the account.');
                setNotice(`We sent a 6-digit code to ${email}.`);
                setStep('code');
                return;
            }
            const { ok, data } = await post<{ user: Reader }>('/api/auth/login', { email, password });
            if (ok) return signedIn(data.user);
            if (/verif|otp|code/i.test(data.error ?? '')) {
                setNotice(`Verify your email first: enter the code sent to ${email}.`);
                setStep('code');
                return;
            }
            setError(data.error ?? 'Sign-in failed.');
        } finally {
            setBusy(false);
        }
    };

    const verify = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setBusy(true);
        try {
            const { ok, data } = await post<{ user: Reader }>('/api/auth/verify', { email, otp: code });
            if (ok) return signedIn(data.user);
            setError(data.error ?? 'Verification failed.');
        } finally {
            setBusy(false);
        }
    };

    const title = step === 'code' ? 'Check your email' : mode === 'register' ? 'Create an account' : 'Sign in';
    const other = mode === 'register' ? { href: '/login', label: 'Sign in', prompt: 'Already have an account?' } : { href: '/register', label: 'Create one', prompt: 'New here?' };
    const nextQuery = returnTo !== '/' ? `?next=${encodeURIComponent(returnTo)}` : '';

    return (
        <div className="mx-auto w-full max-w-sm rounded-3xl border border-foreground/10 bg-background/80 p-6 shadow-lg shadow-primary/5 backdrop-blur-xl">
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-foreground/60">
                {step === 'code' ? notice : 'React to posts and join the conversation.'}
            </p>

            {error && (
                <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </p>
            )}

            {step === 'form' ? (
                <>
                    <div className="mt-5">
                        <OAuthButtons returnTo={returnTo} />
                    </div>
                    <div className="my-5 flex items-center gap-3 text-xs text-foreground/50">
                        <span className="h-px flex-1 bg-foreground/10" /> or with email <span className="h-px flex-1 bg-foreground/10" />
                    </div>
                    <form onSubmit={submit} className="grid gap-4" noValidate>
                        {mode === 'register' && (
                            <div className="grid gap-2">
                                <Label htmlFor="auth-name">Name</Label>
                                <Input id="auth-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="auth-email">Email</Label>
                            <Input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="auth-password">Password</Label>
                            <Input
                                id="auth-password"
                                type="password"
                                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="rounded-xl"
                            />
                            {mode === 'register' && <p className="text-xs text-foreground/50">At least {MIN_PASSWORD} characters.</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={busy || !email || !password}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
                        >
                            {busy && <Loader2 className="size-4 animate-spin" />}
                            {mode === 'register' ? 'Create account' : 'Sign in'}
                        </button>
                    </form>
                    <p className="mt-5 text-center text-sm text-foreground/60">
                        {other.prompt}{' '}
                        <Link href={`${other.href}${nextQuery}`} className="font-medium text-primary hover:underline">
                            {other.label}
                        </Link>
                    </p>
                </>
            ) : (
                <form onSubmit={verify} className="mt-5 grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="auth-code">6-digit code</Label>
                        <Input
                            id="auth-code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            className="rounded-xl text-center font-mono text-lg tracking-[0.4em]"
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={busy || code.length !== 6}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
                    >
                        {busy && <Loader2 className="size-4 animate-spin" />}
                        Verify &amp; continue
                    </button>
                    <button type="button" onClick={() => setStep('form')} className="text-sm text-foreground/60 hover:underline">
                        Back
                    </button>
                </form>
            )}
        </div>
    );
}
