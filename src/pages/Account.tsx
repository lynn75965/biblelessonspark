import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Loader2 } from "lucide-react";
import { SubscriptionManagement } from "@/components/subscription/SubscriptionManagement";
import { MyOrganizationSection } from "@/components/account/MyOrganizationSection";
import { BRANDING } from "@/config/branding";

export default function Account() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className={BRANDING.layout.pageWrapper}>
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className={BRANDING.layout.pageWrapper}>
      <Header isAuthenticated organizationName={BRANDING.appName} />
      <main className={`container ${BRANDING.layout.containerPadding} ${BRANDING.layout.mainContent}`}>
        <div className={`${BRANDING.layout.containerNarrow} space-y-8`}>
          <div>
            <h1 className="text-3xl font-bold mb-2">Account</h1>
            <p className="text-muted-foreground">Manage your subscription, billing, and organization</p>
          </div>
          
          {/* Organization Section - shows for org members */}
          <MyOrganizationSection />
          
          {/* Subscription Section */}
          <SubscriptionManagement />
        </div>
      </main>
      <Footer />
    </div>
  );
}
