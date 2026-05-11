import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BLOG_CONFIG, type BlogPost } from "@/constants/blogConfig";
import { getPageTitle } from "@/config/branding";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BlogCard, { type BlogCardPost } from "@/components/blog/BlogCard";
import BlogHeaderNav from "@/components/blog/BlogHeaderNav";

const SELECT_COLUMNS =
  "id, title, slug, excerpt, content, featured_image_url, published_at";

function setMetaDescription(content: string) {
  let tag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", "description");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="p-5">
        <Skeleton className="mb-3 h-6 w-3/4" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-4 h-4 w-5/6" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogCardPost[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // SEO: page title + meta description, restored on unmount
  useEffect(() => {
    const previousTitle = document.title;
    const previousDescTag = document.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement | null;
    const previousDesc = previousDescTag
      ? previousDescTag.getAttribute("content")
      : null;

    document.title = getPageTitle(BLOG_CONFIG.ui.title);
    setMetaDescription(BLOG_CONFIG.ui.metaDescription);

    return () => {
      document.title = previousTitle;
      if (previousDesc !== null) setMetaDescription(previousDesc);
    };
  }, []);

  // Initial page load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error: queryError, count } = await supabase
        .from(BLOG_CONFIG.table)
        .select(SELECT_COLUMNS, { count: "exact" })
        .eq("published", true)
        .order("published_at", { ascending: false })
        .range(0, BLOG_CONFIG.pagination.pageSize - 1);

      if (cancelled) return;
      if (queryError) {
        setError(queryError.message);
        setPosts([]);
        setTotalCount(0);
      } else {
        setPosts(((data ?? []) as unknown) as BlogCardPost[]);
        setTotalCount(count ?? 0);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLoadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    const from = posts.length;
    const to = from + BLOG_CONFIG.pagination.pageSize - 1;

    const { data, error: queryError, count } = await supabase
      .from(BLOG_CONFIG.table)
      .select(SELECT_COLUMNS, { count: "exact" })
      .eq("published", true)
      .order("published_at", { ascending: false })
      .range(from, to);

    if (queryError) {
      setError(queryError.message);
    } else if (data && data.length > 0) {
      setPosts((current) => [
        ...current,
        ...(((data) as unknown) as BlogCardPost[]),
      ]);
      setTotalCount(count ?? totalCount);
      setError(null);
    }
    setLoadingMore(false);
  }

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      const title = p.title.toLowerCase();
      const excerpt = (p.excerpt ?? "").toLowerCase();
      return title.includes(q) || excerpt.includes(q);
    });
  }, [posts, searchQuery]);

  const hasMore = totalCount !== null && posts.length < totalCount;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <BlogHeaderNav />
      <header className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center md:py-16">
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {BLOG_CONFIG.ui.title}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
            {BLOG_CONFIG.ui.metaDescription}
          </p>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <label htmlFor="blog-search" className="sr-only">
            {BLOG_CONFIG.ui.searchPlaceholder}
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="blog-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={BLOG_CONFIG.ui.searchPlaceholder}
              className="h-12 pl-10 text-base"
              aria-controls="blog-results"
            />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-8 md:py-12">
        <div aria-live="polite" aria-busy={loading} className="sr-only">
          {loading ? BLOG_CONFIG.ui.loadingLabel : ""}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: BLOG_CONFIG.pagination.pageSize }).map(
              (_, i) => (
                <SkeletonCard key={i} />
              ),
            )}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">
              {BLOG_CONFIG.ui.emptyState}
            </p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center">
            <Search
              aria-hidden="true"
              className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60"
            />
            <p className="text-lg text-muted-foreground">
              {BLOG_CONFIG.ui.searchEmptyState}
            </p>
          </div>
        ) : (
          <>
            <ul
              id="blog-results"
              className="grid list-none grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {filteredPosts.map((post) => (
                <li key={post.id} className="h-full">
                  <BlogCard post={post} />
                </li>
              ))}
            </ul>

            {!isSearching && hasMore && (
              <div className="mt-10 flex justify-center">
                <Button
                  type="button"
                  onClick={handleLoadMore}
                  aria-disabled={loadingMore || undefined}
                  className={`min-w-[160px] ${loadingMore ? "cursor-wait opacity-70" : ""}`}
                >
                  {loadingMore
                    ? BLOG_CONFIG.ui.loadingMoreLabel
                    : BLOG_CONFIG.ui.loadMoreLabel}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
