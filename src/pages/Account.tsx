import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Loader2 } from "lucide-react";
import { SubscriptionManagement } from "@/components/subscription/SubscriptionManagement";

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated organizationName="LessonSpark USA" />
      <main className="container py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Account</h1>
            <p className="text-muted-foreground">Manage your subscription and billing</p>
          </div>
          
          <SubscriptionManagement />
        </div>
      </main>
    </div>
  );
}
