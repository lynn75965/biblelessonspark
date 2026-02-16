import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { BaptistIdentitySection } from "@/components/landing/BaptistIdentitySection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { ROUTES } from "@/constants/routes";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSystemSettings();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    message: "",
  });

  useEffect(() => {
    if (user) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [user, navigate]);

  const handleRequestAccess = () => {
    setShowRequestDialog(true);
  };

  const handleSignIn = () => {
    navigate("/auth");
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Request submitted!",
      description: "We'll review your application and get back to you within 48 hours.",
    });
    setShowRequestDialog(false);
    setFormData({ name: "", email: "", organization: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onAuthClick={handleSignIn} />

      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection onRequestAccess={handleRequestAccess} onSignIn={handleSignIn} />

        {/* 2. Baptist Identity - Moved up for immediate trust */}
        <BaptistIdentitySection />

        {/* 3. How It Works - Simple 3-step process */}
        <HowItWorksSection />

        {/* 4. Features - Reduced to 4 key features */}
        <section id="features">
          <FeaturesSection />
        </section>

        {/* 5. Pricing - After value is established */}
        {settings.show_pricing && <PricingSection />}
      </main>

      {/* Footer - SSOT Component */}
      <Footer />

      {/* Request Access Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl">Request Early Access</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Join our private beta program for Baptist teachers and church leaders.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRequest} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm">
                Full Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
                className="min-h-[44px] text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
                className="min-h-[44px] text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="organization" className="text-xs sm:text-sm">
                Church/Organization
              </Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData((prev) => ({ ...prev, organization: e.target.value }))}
                required
                className="min-h-[44px] text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="message" className="text-xs sm:text-sm">
                Tell us about your ministry (optional)
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Age groups you teach, current tools you use, etc."
                rows={3}
                className="text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowRequestDialog(false)}
                className="flex-1 min-h-[44px] text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button type="submit" variant="hero" className="flex-1 min-h-[44px] text-sm sm:text-base">
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;

