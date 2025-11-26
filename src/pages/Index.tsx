import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
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
import { BookOpen, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FOOTER_LINKS } from "@/config/footerLinks";
import { SITE } from "@/config/site";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    message: "",
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
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
    <div className="min-h-screen bg-background">
      <Header onAuthClick={handleSignIn} />

      <main>
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
        <PricingSection />
      </main>

      {/* Footer */}
      <footer className="bg-muted py-8 sm:py-10 lg:py-12">
        <div className="container px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Brand */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-primary">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold gradient-text">LessonSpark USA</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Baptist Bible Study Enhancement Platform</p>
            </div>

            {/* Product */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Product</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <a href={FOOTER_LINKS.product.features} className="hover:text-primary transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href={FOOTER_LINKS.product.pricing} className="hover:text-primary transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href={FOOTER_LINKS.product.setup} className="hover:text-primary transition-colors">
                    Setup Guide
                  </a>
                </li>
                <li>
                  <a href={FOOTER_LINKS.product.docs} className="hover:text-primary transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Support</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <a href={FOOTER_LINKS.support.help} className="hover:text-primary transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href={FOOTER_LINKS.support.contact} className="hover:text-primary transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href={FOOTER_LINKS.support.training} className="hover:text-primary transition-colors">
                    Training
                  </a>
                </li>
                <li>
                  <a href={FOOTER_LINKS.support.community} className="hover:text-primary transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">Legal</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <a href={FOOTER_LINKS.legal.privacy} className="hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href={FOOTER_LINKS.legal.terms} className="hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href={FOOTER_LINKS.legal.cookie} className="hover:text-primary transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-6 sm:mt-8 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2024 LessonSpark USA. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">{SITE.supportEmail}</span>
            </div>
          </div>
        </div>
      </footer>

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
