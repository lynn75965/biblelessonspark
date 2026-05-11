import { Link } from "react-router-dom";
import { BLOG_CONFIG, type BlogPost } from "@/constants/blogConfig";

export type BlogCardPost = Pick<
  BlogPost,
  "id" | "title" | "slug" | "excerpt" | "content" | "featured_image_url" | "published_at"
>;

type BlogCardProps = {
  post: BlogCardPost;
};

function formatPublishedDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
}

function estimateReadMinutes(content: string, wpm: number): number {
  const words = stripHtml(content).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wpm));
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > Math.floor(max * 0.6) ? slice.slice(0, lastSpace) : slice;
  return base.trimEnd() + "...";
}

function buildPostHref(slug: string): string {
  return BLOG_CONFIG.routes.post.replace(":slug", slug);
}

export default function BlogCard({ post }: BlogCardProps) {
  const href = buildPostHref(post.slug);
  const date = formatPublishedDate(post.published_at);
  const readMinutes = estimateReadMinutes(
    post.content,
    BLOG_CONFIG.readTime.wordsPerMinute,
  );
  const excerptText = post.excerpt
    ? truncate(post.excerpt, BLOG_CONFIG.excerpt.maxChars)
    : "";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-within:-translate-y-1 focus-within:shadow-lg">
      <Link
        to={href}
        tabIndex={-1}
        aria-hidden="true"
        className="block"
      >
        {post.featured_image_url ? (
          <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
            <img
              src={post.featured_image_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div
            className="aspect-[16/9] w-full bg-gradient-to-br from-primary/15 to-secondary/15"
            aria-hidden="true"
          />
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="mb-2 text-xl font-bold leading-tight tracking-tight text-foreground">
          <Link
            to={href}
            className="rounded-sm text-foreground hover:text-primary focus:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {post.title}
          </Link>
        </h2>

        {excerptText && (
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            {excerptText}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {date && (
            <time dateTime={post.published_at ?? undefined}>{date}</time>
          )}
          {date && (
            <span aria-hidden="true" className="opacity-50">
              {"\u00B7"}
            </span>
          )}
          <span>
            {readMinutes} {BLOG_CONFIG.ui.readTimeSuffix}
          </span>
        </div>

        <Link
          to={href}
          className="mt-4 inline-flex items-center gap-1 self-start rounded-sm text-sm font-semibold text-primary hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`${BLOG_CONFIG.ui.readMoreLabel}: ${post.title}`}
        >
          {BLOG_CONFIG.ui.readMoreLabel}
          <span aria-hidden="true">{"\u2192"}</span>
        </Link>
      </div>
    </article>
  );
}
