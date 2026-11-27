'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { signOut, useReader } from '@/shared/hooks/use-reader';
import { cn } from '@/shared/libs/utils';

function initials(name: string | null, email: string | null): string {
    const source = (name || email || '?').trim();
    return source.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

/** "Sign in" link, or the signed-in reader's avatar with a sign-out menu. */
export function AccountMenu({ className }: { className?: string }) {
    const { status, reader } = useReader();
    const pathname = usePathname();

    if (status === 'loading') return <span className={cn('size-8 rounded-full bg-foreground/5', className)} aria-hidden />;

    if (!reader) {
        const next = pathname && pathname !== '/login' && pathname !== '/register' ? `?next=${encodeURIComponent(pathname)}` : '';
        return (
            <Link
                href={`/login${next}`}
                className={cn('pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm hover:bg-foreground/5', className)}
            >
                <LogIn className="size-4" /> Sign in
            </Link>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className={cn('pointer-events-auto rounded-full outline-none', className)} aria-label="Account menu">
                <Avatar className="size-8 ring-1 ring-foreground/10">
                    {reader.avatar && <AvatarImage src={reader.avatar} alt={reader.name ?? ''} referrerPolicy="no-referrer" />}
                    <AvatarFallback className="text-xs">{initials(reader.name, reader.email)}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                    {reader.name || 'Reader'}
                    {reader.email && <span className="block truncate text-xs font-normal text-foreground/60">{reader.email}</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}>
                    <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
