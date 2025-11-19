import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { PricingSection } from "@/components/landing/PricingSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SetupChecklist } from "@/components/setup/SetupChecklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Mail, Heart, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FOOTER_LINKS } from "@/config/footerLinks";
import { SITE } from "@/config/site";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
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
        <HeroSection onRequestAccess={handleRequestAccess} onSignIn={handleSignIn} />

        <section id="features">
          <FeaturesSection />
        </section>

        <PricingSection />

        {/* Setup Preview Section */}
        <section className="py-10 sm:py-16 lg:py-20 bg-muted/20">
          <div className="container px-4 sm:px-6">
            <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold px-2">
                <span className="gradient-text">Setup Made Simple</span>
              </h2>
              <p className="text-sm sm:text-base lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                Our comprehensive setup guide walks you through every step with verification buttons to ensure
                everything works perfectly before you start using LessonSpark USA.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-card shadow-glow border-primary/20">
                <CardHeader className="text-center p-4 sm:p-6">
                  <CardTitle className="flex items-center justify-center gap-2 text-base sm:text-lg lg:text-xl">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    Interactive Setup Checklist
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Click below to see our step-by-step setup process
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center p-4 sm:p-6 pt-0">
                  <Button
                    variant="hero"
                    size="lg"
                    className="min-h-[44px] w-full sm:w-auto text-sm sm:text-base"
                    onClick={() => setShowSetupDialog(true)}
                  >
                    Preview Setup Guide
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-10 sm:py-16 lg:py-20">
          <div className="container px-4 sm:px-6">
            <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold px-2">
                Built for <span className="gradient-text">Baptist Churches</span>
              </h2>
              <p className="text-sm sm:text-base lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
                We understand Baptist theology, traditions, and the unique needs of your ministry. LessonSpark USA is
                designed by Baptists, for Baptists.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <Card className="text-center bg-gradient-card">
                <CardHeader className="p-4 sm:p-6">
                  <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-3 sm:mb-4">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg mb-2">Baptist Heritage</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Respects Baptist autonomy, theology, and traditional practices while embracing helpful technology.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center bg-gradient-card">
                <CardHeader className="p-4 sm:p-6">
                  <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-secondary flex items-center justify-center mb-3 sm:mb-4">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg mb-2">Doctrinally Sound</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Select and be confident your lesson will express the sound doctrine of your congregation.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center bg-gradient-card">
                <CardHeader className="p-4 sm:p-6">
                  <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-3 sm:mb-4">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg mb-2">Community Focused</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Built with input from Baptist teachers and pastors who understand your daily ministry challenges.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
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

      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>LessonSpark USA Setup Guide</DialogTitle>
            <DialogDescription>
              Complete setup checklist with step-by-step instructions and verification
            </DialogDescription>
          </DialogHeader>
          <SetupChecklist isModal onClose={() => setShowSetupDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
