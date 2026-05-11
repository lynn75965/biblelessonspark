import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { BRANDING } from "@/config/branding";
import { ROUTES } from "@/constants/routes";
import { BLOG_CONFIG } from "@/constants/blogConfig";
import { BlogPreviewPanel } from "@/components/admin/BlogPreviewPanel";

export default function AdminBlogPreview() {
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
      <BlogPreviewPanel />
    </AppShell>
  );
}
