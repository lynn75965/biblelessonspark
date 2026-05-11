import { Link } from "react-router-dom";
import { BRANDING } from "@/config/branding";
import { BLOG_CONFIG } from "@/constants/blogConfig";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";

export default function BlogHeaderNav() {
  return (
    <nav
      aria-label={BRANDING.appName}
      className="border-b border-border bg-card"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`${BRANDING.appName} home`}
        >
          <img
            src={BRANDING.logo.primary}
            alt={BRANDING.logo.altText}
            className="h-10 w-auto md:h-12"
          />
        </Link>

        <Button asChild type="button" className="shrink-0">
          <Link to={ROUTES.HOME}>{BLOG_CONFIG.ui.homeButtonLabel}</Link>
        </Button>
      </div>
    </nav>
  );
}
