"use client";
import Link from "next/link"
import { useState, Suspense } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/shared/libs/utils";
import MagneticArea from "../ui/magnetic-area";
import { ThemeToggle } from "../ui/theme-switch";
import { Button } from "../ui/button";
import { navbarMenu } from "@/shared/data";
import GithubIcon from "../icons/github";
import { MobileNav, MobileNavHeader, MobileNavMenu, MobileNavToggle, Navbar, NavbarLogo, NavBody, NavItems } from "./resizable-navbar";
import { AccountMenu } from "./account-menu";

export const NavigationBar = ({ className }: { className?: string }) => {
    return (
        <Suspense fallback={null}>
            <NavigationBarInner className={className} />
        </Suspense>
    )
}

const NavigationBarInner = ({ className }: { className?: string }) => {
    const pathname = usePathname();



    const navItems = navbarMenu.map((item) => ({
        ...item,
        active: pathname === item.link || pathname.startsWith(item.link)
    }))

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <Navbar className={cn("max-w-5xl mx-auto justify-center", className)}>
            {/* Desktop Navigation */}
            <NavBody>
                <NavbarLogo />
                <NavItems items={navItems} />
                <div className="flex items-center justify-self-end gap-3 z-50">
                    <MagneticArea>
                        <ThemeToggle className="scale-90" />
                    </MagneticArea>
                    <MagneticArea>
                        <Link className="pointer-events-auto z-50" aria-label="GitHub repository" href="https://github.com/pphatdev">
                            <GithubIcon />
                        </Link>
                    </MagneticArea>
                    <AccountMenu />
                </div>
            </NavBody>

            {/* Mobile Navigation */}
            <MobileNav>
                <MobileNavHeader>
                    <NavbarLogo />
                    <MobileNavToggle
                        isOpen={isMobileMenuOpen}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    />
                </MobileNavHeader>

                <MobileNavMenu
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                    className="px-7 rounded-3xl"
                >
                    <ol className="w-full flex flex-col items-center justify-center gap-2">
                        {navItems.map((item, idx) => (
                            <li key={idx} className="w-full px-5">
                                <Button asChild className={cn("w-full text-foreground mt-0", item.active && "text-primary")}>
                                    <Link href={item.link} onClick={() => setIsMobileMenuOpen(false)}>
                                        {item.name}
                                    </Link>
                                </Button>
                            </li>
                        ))}
                    </ol>
                    <div className="flex w-full items-center justify-center mt-5 gap-4">

                        <MagneticArea>
                            <ThemeToggle className="scale-90" />
                        </MagneticArea>

                        <MagneticArea>
                            <Link aria-label="GitHub repository" href="https://github.com/pphatdev">
                                <GithubIcon className="size-7" />
                            </Link>
                        </MagneticArea>
                        <AccountMenu />
                    </div>
                </MobileNavMenu>
            </MobileNav>
        </Navbar>
    )
}