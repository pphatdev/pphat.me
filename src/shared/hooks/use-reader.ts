'use client';

import { useSyncExternalStore } from 'react';

/** Public reader profile from /api/auth/me (tokens never reach the browser). */
export interface Reader {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    role: string;
}

type State = { status: 'loading' | 'ready'; reader: Reader | null };

let state: State = { status: 'loading', reader: null };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: State) {
    state = next;
    listeners.forEach((l) => l());
}

/** Load (or reload) the signed-in reader; concurrent callers share one request. */
export function refreshReader(): Promise<void> {
    inflight ??= fetch('/api/auth/me', { cache: 'no-store' })
        .then((r) => (r.ok ? (r.json() as Promise<{ user: Reader | null }>) : { user: null }))
        .then(({ user }) => emit({ status: 'ready', reader: user }))
        .catch(() => emit({ status: 'ready', reader: null }))
        .finally(() => {
            inflight = null;
        });
    return inflight;
}

export function setReader(reader: Reader | null) {
    emit({ status: 'ready', reader });
}

export async function signOut(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setReader(null);
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    if (state.status === 'loading' && !inflight) void refreshReader();
    return () => listeners.delete(listener);
}

const SERVER_STATE: State = { status: 'loading', reader: null };

/** The signed-in reader, shared by every component on the page. */
export function useReader(): State {
    return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}
