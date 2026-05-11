import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Newspaper, Radio, Mail, Send } from "lucide-react";
import { BRANDING } from "@/config/branding";
import { ROUTES } from "@/constants/routes";
import { BLOG_CONFIG } from "@/constants/blogConfig";
import { BlogPreviewPanel } from "@/components/admin/BlogPreviewPanel";

function ComingSoonPanel({ label, blurb }: { label: string; blurb: string }) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Megaphone aria-hidden="true" className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">{label}</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{blurb}</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Coming soon
        </p>
      </CardContent>
    </Card>
  );
}

export default function AdminMarketing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        navigate(ROUTES.AUTH);
        return;
      }
      const { data: hasAdminRole, error: roleError } = await supabase.rpc(
        "has_role",
        { _user_id: user.id, _role: "admin" },
      );
      if (cancelled) return;
      if (roleError || !hasAdminRole) {
        toast({
          title: BLOG_CONFIG.admin.accessDeniedTitle,
          description: BLOG_CONFIG.admin.accessDeniedBody,
          variant: "destructive",
        });
        navigate(ROUTES.DASHBOARD);
        return;
      }
      setAuthChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, navigate, toast]);

  if (authChecking) {
    return (
      <div className={`${BRANDING.layout.pageWrapper} items-center justify-center`}>
        <Card className="bg-gradient-card">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Verifying admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary sm:h-14 sm:w-14">
            <Megaphone className="h-5 w-5 text-white sm:h-6 sm:w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold sm:text-3xl">Marketing Panel</h1>
            <p className="truncate text-sm text-muted-foreground sm:text-base">
              Review and approve outbound content before it goes live
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="blog-preview" className="w-full">
        <TabsList
          aria-label="Marketing review channels"
          className="flex w-full overflow-x-auto bg-muted p-1 rounded-lg mb-2 relative z-10"
        >
          <TabsTrigger
            value="blog-preview"
            className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap"
          >
            <Newspaper aria-hidden="true" className="w-4 h-4 sm:mr-1.5" />
            <span className="text-xs sm:text-sm">Blog Preview</span>
          </TabsTrigger>
          <TabsTrigger
            value="amp-articles"
            disabled
            aria-label="Amp Articles, coming soon"
            className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap"
          >
            <Radio aria-hidden="true" className="w-4 h-4 sm:mr-1.5" />
            <span className="text-xs sm:text-sm">Amp Articles</span>
          </TabsTrigger>
          <TabsTrigger
            value="newsletter"
            disabled
            aria-label="Newsletter, coming soon"
            className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap"
          >
            <Mail aria-hidden="true" className="w-4 h-4 sm:mr-1.5" />
            <span className="text-xs sm:text-sm">Newsletter</span>
          </TabsTrigger>
          <TabsTrigger
            value="email-marketing"
            disabled
            aria-label="Email Marketing, coming soon"
            className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap"
          >
            <Send aria-hidden="true" className="w-4 h-4 sm:mr-1.5" />
            <span className="text-xs sm:text-sm">Email Marketing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blog-preview" className="mt-6 relative z-0">
          <BlogPreviewPanel showHeader={false} />
        </TabsContent>

        <TabsContent value="amp-articles" className="mt-6 relative z-0">
          <ComingSoonPanel
            label="Amp Articles"
            blurb="Preview and approve articles before they go out to Ampifire for syndication."
          />
        </TabsContent>

        <TabsContent value="newsletter" className="mt-6 relative z-0">
          <ComingSoonPanel
            label="Newsletter"
            blurb="Preview and approve newsletter editions before send."
          />
        </TabsContent>

        <TabsContent value="email-marketing" className="mt-6 relative z-0">
          <ComingSoonPanel
            label="Email Marketing"
            blurb="Compose, review, and schedule marketing email campaigns."
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
