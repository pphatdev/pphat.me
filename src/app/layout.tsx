import { Suspense } from 'react';
import "../shared/styles/globals.css"
import { ThemeProvider } from '@/shared/extension/next-theme-provider';
import { aladin, kantumruyPro, poppins, srisakdi, openSans } from "@/shared/libs/fonts";
import { cn } from "@/shared/libs/utils";
import ProgressBarProvider from '@/shared/extension/progress-bar-provider';
import DefaultHead from '@/shared/seo/head';
import { NavigationBar } from "@/shared/components/layouts/navbar";
import { GridPattern } from "@/shared/components/background/grid-pattern";
import { Metadata } from "next";
import { getOrigin } from "@/shared/seo/origin";

export async function generateMetadata(): Promise<Metadata> {
    return { metadataBase: new URL(await getOrigin()) };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en" suppressHydrationWarning className="scroll-smooth" data-scroll-behavior="smooth">
            <head>
                {/*
                    Turbopack minifies next-themes' blocking inline script with esbuild
                    keepNames, which emits __name(fn, "fn") calls but drops the helper
                    definition. Shim it here so the theme-init script doesn't throw
                    "__name is not defined" before hydration.
                */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: 'var __name=function(t,n){try{Object.defineProperty(t,"name",{value:n,configurable:true})}catch(e){}return t};var __name2=__name;',
                    }}
                />
                <DefaultHead />
            </head>
            <body className={cn(poppins.variable, kantumruyPro.variable, aladin.variable, srisakdi.variable, openSans.variable, `antialiased p-0 m-0 font-sans bg-body `)} style={{ overflowX: 'hidden' }}>
                <ThemeProvider
                    attribute="class"
                    enableSystem
                    defaultTheme="system"
                    disableTransitionOnChange
                >
                    <ProgressBarProvider>
                        <Suspense fallback={null}>
                            <NavigationBar />
                        </Suspense>
                        <div className="absolute inset-y-0 left-1/3 right-0 pointer-events-none" aria-hidden="true">
                            <GridPattern width={30} height={30} x={-1} y={-1} strokeDasharray={"4 2"} className={"mask-[radial-gradient(300px_circle_at_center,white,transparent)] absolute w-full "} />
                        </div>
                        {children}
                    </ProgressBarProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}