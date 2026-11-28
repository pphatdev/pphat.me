'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { ArrowUpRight, BookOpen, ChevronRight, LayoutDashboard, Loader2, LogIn, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { signOut, useReader } from '@/shared/hooks/use-reader';
import { cn } from '@/shared/libs/utils';
import { ADMIN_URL } from '@/shared/libs/constants';

function initials(name: string | null, email: string | null): string {
    const source = (name || email || '?').trim();
    return source.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

/** "Sign in" link, or the signed-in reader's avatar with a profile-card menu. */
export function AccountMenu({ className }: { className?: string }) {
    const { status, reader } = useReader();
    const pathname = usePathname();
    const [signingOut, setSigningOut] = useState(false);

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

    const isAdmin = reader.role === 'admin';
    const fallback = initials(reader.name, reader.email);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    'pointer-events-auto rounded-full outline-none transition-shadow',
                    'hover:ring-2 hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/60',
                    className,
                )}
                aria-label="Account menu"
            >
                <Avatar className="size-8 ring-1 ring-foreground/10">
                    {reader.avatar && <AvatarImage src={reader.avatar} alt={reader.name ?? ''} referrerPolicy="no-referrer" />}
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">{fallback}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={10} className="w-72 overflow-hidden rounded-2xl border-0 p-0 ring-1 ring-foreground/10">
                {/* Profile card */}
                <div className="relative">
                    <div aria-hidden className="h-16 bg-linear-to-br from-primary/40 via-primary/15 to-transparent" />
                    <div className="-mt-9 flex flex-col items-center px-4 pb-4 text-center">
                        <Avatar className="size-16 shadow-lg ring-4 ring-popover">
                            {reader.avatar && <AvatarImage src={reader.avatar} alt="" referrerPolicy="no-referrer" />}
                            <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">{fallback}</AvatarFallback>
                        </Avatar>
                        <p className="mt-2 max-w-full truncate text-base font-semibold">{reader.name || 'Reader'}</p>
                        {reader.email && <p className="max-w-full truncate text-xs text-foreground/60">{reader.email}</p>}
                        <span
                            className={cn(
                                'mt-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1',
                                isAdmin ? 'bg-primary/15 text-primary ring-primary/25' : 'bg-foreground/5 text-foreground/60 ring-foreground/10',
                            )}
                        >
                            {isAdmin ? 'Admin' : 'Reader'}
                        </span>
                    </div>
                </div>

                <DropdownMenuSeparator className="m-0 bg-foreground/10" />

                {/* Links */}
                <div className="p-1.5">
                    <DropdownMenuItem asChild className={itemClass}>
                        <Link href="/posts">
                            <IconTile><BookOpen /></IconTile>
                            Read posts
                            <ChevronRight className="ml-auto size-4 text-foreground/40" />
                        </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                        <DropdownMenuItem asChild className={itemClass}>
                            <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer">
                                <IconTile><LayoutDashboard /></IconTile>
                                Dashboard
                                <ArrowUpRight className="ml-auto size-4 text-foreground/40" />
                            </a>
                        </DropdownMenuItem>
                    )}
                    <ThemeRow />
                </div>

                <DropdownMenuSeparator className="m-0 bg-foreground/10" />

                {/* Sign out */}
                <div className="p-2">
                    <DropdownMenuItem
                        variant="destructive"
                        disabled={signingOut}
                        className="cursor-pointer justify-center gap-2 rounded-xl bg-destructive/10 py-2.5 font-medium ring-1 ring-destructive/20 focus:bg-destructive/15"
                        onSelect={(e) => {
                            e.preventDefault(); // keep the menu open to show progress
                            setSigningOut(true);
                            void signOut().finally(() => setSigningOut(false));
                        }}
                    >
                        {signingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
                        {signingOut ? 'Signing out…' : 'Sign out'}
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const itemClass = 'cursor-pointer gap-3 rounded-xl px-2 py-2';

function IconTile({ children }: { children: React.ReactNode }) {
    return (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground/5 ring-1 ring-foreground/10 [&_svg]:size-4 [&_svg]:text-foreground/70">
            {children}
        </span>
    );
}

const THEMES = [
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark', label: 'Dark', Icon: Moon },
    { value: 'system', label: 'System', Icon: Monitor },
] as const;

/** Theme picker; each segment is a menu item, so arrow keys reach it and the menu stays open. */
function ThemeRow() {
    const { theme, setTheme } = useTheme();
    return (
        <div className="flex items-center gap-3 px-2 py-2 text-sm">
            <IconTile><Sun className="dark:hidden" /><Moon className="hidden dark:block" /></IconTile>
            Theme
            <div role="group" aria-label="Theme" className="ml-auto flex rounded-full bg-foreground/5 p-0.5 ring-1 ring-foreground/10">
                {THEMES.map(({ value, label, Icon }) => (
                    <DropdownMenuItem
                        key={value}
                        aria-label={label}
                        aria-pressed={theme === value}
                        title={label}
                        onSelect={(e) => {
                            e.preventDefault();
                            setTheme(value);
                        }}
                        className={cn(
                            'cursor-pointer rounded-full p-1.5',
                            theme === value ? 'bg-background text-foreground shadow-sm ring-1 ring-foreground/10 [&_svg]:text-primary!' : 'focus:bg-foreground/10',
                        )}
                    >
                        <Icon className="size-3.5!" />
                    </DropdownMenuItem>
                ))}
            </div>
        </div>
    );
}
