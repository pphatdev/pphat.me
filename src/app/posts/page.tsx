import { Suspense } from "react";
import { BlogHero } from "./hero";
import ArticleCard from "@/shared/components/ui/article-card";
import { Spinner } from "@/shared/components/ui/loading";
import { BlurFade } from "@/shared/components/background/blur-fade";
import Footer from "@/shared/components/layouts/footer";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import Link from "next/link";
import { upstream, parseUpstream } from "@/app/api/lib/client";
import { IArticleListResponse } from "@/shared/interfaces/articles";
import { Metadata } from "next";
import { openGraphBase } from "@/shared/seo/site";

const description = "Articles by LEAT Sophat on front-end development, UI/UX design, and the tools and lessons from building for the web.";

export const metadata: Metadata = {
    title: "Blog",
    description,
    alternates: { canonical: "/posts" },
    openGraph: { ...openGraphBase, title: "Blog | LEAT Sophat", description, url: "/posts" },
};

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function BlogsContent({ searchParams }: Props) {
    const params = await searchParams;
    const initialSearch = typeof params.q === 'string' ? params.q : "";
    const currentPage = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;

    // Fetch articles server-side
    const query = new URLSearchParams();
    if (currentPage > 1) query.append('page', currentPage.toString());
    query.append('limit', '10');
    // Never rely on the API key's role for visibility: only public articles.
    query.append('status', 'public');
    if (initialSearch) query.append('search', initialSearch);

    let articles: IArticleListResponse | null = null;
    let error: string | null = null;

    try {
        const response = await upstream(`/v1/api/articles?${query.toString()}`, {
            method: 'GET',
            next: { tags: ['articles', 'posts'], revalidate: 3600 }
        });

        const { ok, data } = await parseUpstream<IArticleListResponse>(response);
        if (ok) {
            articles = data;
        } else {
            error = (data as any).message || 'Failed to load articles';
        }
    } catch (err) {
        error = 'An error occurred while fetching articles';
        console.error(err);
    }

    const totalPages = articles?.pagination?.totalPages || 1;

    const getPageUrl = (pageNumber: number) => {
        const q = new URLSearchParams();
        if (initialSearch) q.set('q', initialSearch);
        if (pageNumber > 1) q.set('page', pageNumber.toString());
        return `?${q.toString()}`;
    };

    return (
        <div className="w-full max-w-5xl mx-auto max-sm:p-0 px-4 pb-16">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7 min-h-[400px]">
                {error && <p className="text-center text-destructive col-span-full">Error: {error}</p>}

                {articles?.data && articles.data.length === 0 && (
                    <BlurFade delay={0.8} inView className="col-span-full flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-2xl border-foreground/10 bg-background/50">
                        <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-5 ring-1 ring-foreground/10 shadow-sm">
                            <SearchX className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">No articles found</h3>
                        <p className="text-muted-foreground max-w-sm">
                            {initialSearch ? `We couldn't find any articles matching "${initialSearch}". Try adjusting your search query.` : "There are currently no articles to display."}
                        </p>
                    </BlurFade>
                )}

                {articles?.data && articles.data.map((article, index) => (
                    <BlurFade key={article.id || index} delay={0.8 + index * 0.05} inView>
                        <ArticleCard article={article} />
                    </BlurFade>
                ))}
            </div>

            {totalPages > 1 && (
                <BlurFade delay={0.8 + (articles?.data?.length || 0) * 0.05} inView className="flex items-center justify-center gap-4 mt-12">
                    {currentPage === 1 ? (
                        <Button variant="outline" disabled className="rounded-full w-10 h-10 p-0" aria-label="Previous page">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    ) : (
                        <Button variant="outline" asChild className="rounded-full w-10 h-10 p-0" aria-label="Previous page">
                            <Link href={getPageUrl(Math.max(1, currentPage - 1))} scroll={false}>
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                    )}

                    <span className="text-sm font-medium text-foreground/80">
                        Page {currentPage} of {totalPages}
                    </span>

                    {currentPage === totalPages ? (
                        <Button variant="outline" disabled className="rounded-full w-10 h-10 p-0" aria-label="Next page">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    ) : (
                        <Button variant="outline" asChild className="rounded-full w-10 h-10 p-0" aria-label="Next page">
                            <Link href={getPageUrl(Math.min(totalPages, currentPage + 1))} scroll={false}>
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </Button>
                    )}
                </BlurFade>
            )}
        </div>
    );
}



export default function Blogs({ searchParams }: Props) {
    return (
        <main className="w-full flex flex-col gap-7">
            <Suspense fallback={<div className="min-h-36 sm:min-h-60" />}>
                <BlogHero />
            </Suspense>
            <Suspense fallback={<div className="w-full min-h-[400px] flex justify-center items-center"><Spinner variant="bars" /></div>}>
                <BlogsContent searchParams={searchParams} />
            </Suspense>
            <Footer />
        </main>
    );
}
