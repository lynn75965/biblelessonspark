import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BLOG_CONFIG, type BlogPost as BlogPostRow } from "@/constants/blogConfig";

function formatPublishedDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error: queryError } = await supabase
        .from(BLOG_CONFIG.table)
        .select("id, title, slug, excerpt, content, published, published_at, created_at")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();

      if (cancelled) return;
      if (queryError) {
        setError(queryError.message);
      } else if (!data) {
        setNotFound(true);
      } else {
        setPost(data as BlogPostRow);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!loading && (post || notFound) && headingRef.current) {
      headingRef.current.focus();
    }
  }, [loading, post, notFound]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <div className="mb-8">
          <Link
            to={BLOG_CONFIG.routes.index}
            className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            {BLOG_CONFIG.ui.backLabel}
          </Link>
        </div>

        <div aria-live="polite" aria-busy={loading} className="sr-only">
          {loading ? "Loading post." : ""}
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        {!loading && notFound && (
          <div>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mb-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl"
            >
              Post not found
            </h1>
            <p className="text-lg text-slate-700">
              This post is unavailable or no longer published.
            </p>
          </div>
        )}

        {!loading && post && (
          <article>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mb-4 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl"
            >
              {post.title}
            </h1>
            {post.published_at && (
              <p className="mb-8 text-sm text-slate-500">
                <time dateTime={post.published_at}>{formatPublishedDate(post.published_at)}</time>
              </p>
            )}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        )}
      </section>
    </main>
  );
}
