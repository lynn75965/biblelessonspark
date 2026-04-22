/**
 * VimeoEmbed - Reusable Vimeo iframe wrapper
 *
 * Renders a responsive 16:9 Vimeo player with BLS-standard security and
 * accessibility attributes. Used anywhere a single Vimeo video is embedded.
 *
 * CSP note: frame-src https://player.vimeo.com is allowed in netlify.toml.
 */

interface VimeoEmbedProps {
  /** Vimeo numeric video id (e.g. "1185247853") */
  videoId: string;
  /** Vimeo private-link hash (for unlisted videos) */
  hash?: string;
  /** Title attribute for the iframe - announced by screen readers */
  title: string;
  /** Whether the player should auto-start on mount */
  autoplay?: boolean;
  /** Extra classes applied to the wrapping aspect-video div */
  className?: string;
}

export function VimeoEmbed({
  videoId,
  hash,
  title,
  autoplay = false,
  className = "",
}: VimeoEmbedProps) {
  const params = new URLSearchParams();
  if (hash) params.set("h", hash);
  if (autoplay) params.set("autoplay", "1");
  params.set("title", "0");
  params.set("byline", "0");
  params.set("portrait", "0");

  const src = `https://player.vimeo.com/video/${videoId}?${params.toString()}`;

  return (
    <div className={`aspect-video w-full bg-foreground ${className}`}>
      <iframe
        title={title}
        src={src}
        width="100%"
        height="100%"
        frameBorder="0"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

export default VimeoEmbed;
