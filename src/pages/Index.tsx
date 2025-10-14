import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { PricingCard } from "@/components/subscription/PricingCard";
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


interface SubscriptionPlan {
  id: string;
  name: string;
  lookup_key: string;
  price_monthly_cents: number;
  price_yearly_cents: number;
  credits_monthly: number | null;
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    message: ""
  });

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_monthly_cents", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error("Error loading plans:", error);
    }
  };

  const handleSubscribe = async (plan: SubscriptionPlan, interval: "monthly" | "yearly") => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const lookupKey = interval === "monthly" 
        ? plan.lookup_key 
        : plan.lookup_key.replace("_monthly", "_yearly");

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { lookup_key: lookupKey },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        <HeroSection 
          onRequestAccess={handleRequestAccess}
          onSignIn={handleSignIn}
        />

        <section id="features">
          <FeaturesSection />
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="section">
          <div className="container">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold">
                <span className="gradient-text">Simple, Transparent Pricing</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that works best for you
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <PricingCard
                  key={plan.id}
                  name={plan.name.replace("LessonSparkUSA — ", "")}
                  monthlyPrice={plan.price_monthly_cents}
                  yearlyPrice={plan.price_yearly_cents}
                  credits={plan.credits_monthly}
                  onSubscribe={(interval) => handleSubscribe(plan, interval)}
                  loading={loading}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Setup Preview Section */}
        <section className="section bg-muted/20">
          <div className="container">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold">
                <span className="gradient-text">Setup Made Simple</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our comprehensive setup guide walks you through every step with verification buttons 
                to ensure everything works perfectly before you start using LessonSpark USA.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-card shadow-glow border-primary/20">
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Interactive Setup Checklist
                  </CardTitle>
                  <CardDescription>
                    Click below to see our step-by-step setup process
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="hero" 
                    size="lg"
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
        <section className="section">
          <div className="container">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Built for{" "}
                <span className="gradient-text">Baptist Churches</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                We understand Baptist theology, traditions, and the unique needs of your ministry.
                LessonSpark USA is designed by Baptists, for Baptists.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center bg-gradient-card">
                <CardHeader>
                  <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Baptist Heritage</CardTitle>
                  <CardDescription>
                    Respects Baptist autonomy, theology, and traditional practices while embracing helpful technology.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center bg-gradient-card">
                <CardHeader>
                  <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-secondary flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Doctrinally Sound</CardTitle>
                  <CardDescription>
                    Select and be confident your lesson will express the sound doctrine of your congregation.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="text-center bg-gradient-card">
                <CardHeader>
                  <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle>Community Focused</CardTitle>
                  <CardDescription>
                    Built with input from Baptist teachers and pastors who understand your daily ministry challenges.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">LessonSpark USA</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Baptist Bible Study Enhancement Platform
              </p>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href={FOOTER_LINKS.product.features} className="hover:text-primary transition-colors">Features</a></li>
                <li><a href={FOOTER_LINKS.product.pricing} className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href={FOOTER_LINKS.product.setup} className="hover:text-primary transition-colors">Setup Guide</a></li>
                <li><a href={FOOTER_LINKS.product.docs} className="hover:text-primary transition-colors">Documentation</a></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href={FOOTER_LINKS.support.help} className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href={FOOTER_LINKS.support.contact} className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href={FOOTER_LINKS.support.training} className="hover:text-primary transition-colors">Training</a></li>
                <li><a href={FOOTER_LINKS.support.community} className="hover:text-primary transition-colors">Community</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href={FOOTER_LINKS.legal.privacy} className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href={FOOTER_LINKS.legal.terms} className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href={FOOTER_LINKS.legal.cookie} className="hover:text-primary transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 LessonSpark USA. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                support@lessonspark.com
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Request Access Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Early Access</DialogTitle>
            <DialogDescription>
              Join our private beta program for Baptist teachers and church leaders.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Church/Organization</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({...prev, organization: e.target.value}))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Tell us about your ministry (optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({...prev, message: e.target.value}))}
                placeholder="Age groups you teach, current tools you use, etc."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowRequestDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="hero" className="flex-1">
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