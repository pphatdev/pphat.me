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
import {
    SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_OG_IMAGE, SITE_TITLE, SITE_URL, TWITTER_HANDLE,
} from "@/shared/seo/site";
import { SiteStructuredData } from "@/shared/seo/structured-data";

// Site-wide defaults. Pages override title/description/canonical as needed;
// a page's `title: "Projects"` renders as "Projects | LEAT Sophat".
export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: SITE_TITLE,
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    // No `alternates.canonical` / `openGraph.url` here: children inherit them,
    // which would mark every page as a duplicate of "/". Each page sets its own.
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: SITE_NAME,
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        images: [SITE_OG_IMAGE],
    },
    // No twitter title/description: pages inherit this object as-is, which would
    // give every page the home title. X falls back to each page's og:title.
    twitter: {
        card: 'summary_large_image',
        site: TWITTER_HANDLE,
        creator: TWITTER_HANDLE,
        images: [SITE_OG_IMAGE.url],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
        },
    },
    verification: {
        google: 'googleff785c31669eafd5',
    },
};

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
                <SiteStructuredData />
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