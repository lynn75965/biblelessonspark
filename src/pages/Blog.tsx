import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BLOG_CONFIG, type BlogPost } from "@/constants/blogConfig";

type BlogListItem = Pick<BlogPost, "id" | "title" | "slug" | "excerpt" | "published_at">;

function formatPublishedDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function buildPostHref(slug: string): string {
  return BLOG_CONFIG.routes.post.replace(":slug", slug);
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: queryError } = await supabase
        .from(BLOG_CONFIG.table)
        .select("id, title, slug, excerpt, published_at")
        .eq("published", true)
        .order("published_at", { ascending: false });

      if (cancelled) return;
      if (queryError) {
        setError(queryError.message);
        setPosts([]);
      } else {
        setPosts((data ?? []) as BlogListItem[]);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
          {BLOG_CONFIG.ui.title}
        </h1>

        <div aria-live="polite" aria-busy={loading} className="sr-only">
          {loading ? "Loading posts." : ""}
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <p className="text-lg text-slate-600">{BLOG_CONFIG.ui.emptyState}</p>
        )}

        {!loading && posts.length > 0 && (
          <ul className="space-y-8">
            {posts.map((post) => (
              <li key={post.id} className="border-b border-slate-200 pb-8 last:border-b-0">
                <article>
                  <h2 className="mb-2 text-2xl font-semibold tracking-tight text-slate-950">
                    <Link
                      to={buildPostHref(post.slug)}
                      className="text-blue-700 hover:text-blue-900 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                    >
                      {post.title}
                    </Link>
                  </h2>
                  {post.published_at && (
                    <p className="mb-3 text-sm text-slate-500">
                      <time dateTime={post.published_at}>{formatPublishedDate(post.published_at)}</time>
                    </p>
                  )}
                  {post.excerpt && (
                    <p className="text-base leading-7 text-slate-700">{post.excerpt}</p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
