import type { Metadata } from 'next';
import { AuthForm } from '@/shared/components/auth/auth-form';

export const metadata: Metadata = {
    title: 'Create an account',
    robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
    const { next } = await searchParams;
    return (
        <main className="flex min-h-svh items-center justify-center px-4 pt-28 pb-16">
            <AuthForm mode="register" next={typeof next === 'string' ? next : undefined} />
        </main>
    );
}
