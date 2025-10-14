import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap, Loader2 } from "lucide-react";
import { 
  BillingCycle, 
  UiPlan, 
  getPlans, 
  formatMoney, 
  monthlyEquivalentFromYearly,
  getPlanFeatures 
} from "@/lib/pricingSource";

interface PricingSectionProps {
  onRequestAccess?: () => void;
}

export function PricingSection({ onRequestAccess }: PricingSectionProps) {
  const [cycle, setCycle] = useState<BillingCycle>("yearly");
  const [plans, setPlans] = useState<UiPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Load saved billing cycle preference
  useEffect(() => {
    const saved = localStorage.getItem("billing-cycle");
    if (saved === "monthly" || saved === "yearly") {
      setCycle(saved);
    }
  }, []);

  // Persist billing cycle choice
  useEffect(() => {
    localStorage.setItem("billing-cycle", cycle);
  }, [cycle]);

  // Fetch plans for selected cycle
  useEffect(() => {
    let alive = true;
    setLoading(true);
    getPlans(cycle)
      .then((ps) => { 
        if (alive) setPlans(ps); 
      })
      .catch((err) => {
        console.error("Failed to load pricing plans:", err);
      })
      .finally(() => { 
        if (alive) setLoading(false); 
      });
    return () => { alive = false; };
  }, [cycle]);

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("essential")) return <Zap className="h-5 w-5" />;
    if (name.includes("pro")) return <Star className="h-5 w-5" />;
    if (name.includes("premium")) return <Crown className="h-5 w-5" />;
    return <Star className="h-5 w-5" />;
  };

  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="outline" className="px-4 py-1">
            Pricing
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold">
            Choose Your{" "}
            <span className="gradient-text">Ministry Plan</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transparent pricing designed for Baptist churches of all sizes. 
            Start your journey with a plan that grows with your ministry.
          </p>

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center gap-2 mt-6 rounded-full border border-border bg-card px-2 py-1.5">
            <button
              onClick={() => setCycle("monthly")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                cycle === "monthly" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={cycle === "monthly"}
            >
              Monthly
            </button>
            <span className="text-xs text-muted-foreground">/</span>
            <button
              onClick={() => setCycle("yearly")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                cycle === "yearly" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={cycle === "yearly"}
            >
              Yearly <span className="ml-1 text-xs opacity-80">(save 20%)</span>
            </button>
          </div>

          <p className="text-sm text-muted-foreground">
            {cycle === "yearly" 
              ? "Save 20% with annual billing" 
              : "Switch to yearly to save 20%"}
          </p>
          
          {/* Beta notice */}
          <div className="bg-secondary-light border border-secondary/20 rounded-lg p-4 max-w-2xl mx-auto mt-6">
            <p className="text-secondary-foreground font-medium">
              🎉 Private Beta Special: All plans include 30-day free trial and setup assistance
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-muted-foreground mt-4">Loading pricing plans…</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No pricing plans available. Please contact support.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const planDetails = getPlanFeatures(plan.name);
              const showYearlyHelper = cycle === "yearly";
              const monthlyEq = showYearlyHelper ? monthlyEquivalentFromYearly(plan.priceCents) : null;
              const isPopular = plan.bestValue && cycle === "yearly";

              return (
                <Card 
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-normal hover:shadow-glow ${
                    isPopular 
                      ? "border-primary scale-105 shadow-lg bg-gradient-card" 
                      : "border-border hover:border-primary/20 bg-gradient-card"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-0 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-b-lg">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className={`text-center ${isPopular ? "pt-8" : "pt-6"}`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isPopular ? "bg-gradient-primary" : "bg-muted"
                      }`}>
                        <div className={isPopular ? "text-white" : "text-muted-foreground"}>
                          {getPlanIcon(plan.name)}
                        </div>
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">
                          {formatMoney(plan.priceCents, plan.currency.toUpperCase())}
                        </span>
                        <span className="text-muted-foreground">
                          {cycle === "yearly" ? "/year" : "/month"}
                        </span>
                      </div>
                      {showYearlyHelper && monthlyEq !== null && (
                        <p className="text-xs text-muted-foreground">
                          That's just {formatMoney(monthlyEq, plan.currency.toUpperCase())}/month
                        </p>
                      )}
                      <CardDescription className="text-sm">
                        {planDetails.description}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Credits info */}
                    <div className="text-center py-2 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">
                        {plan.creditsMonthly === null 
                          ? "Unlimited lesson enhancements" 
                          : `${plan.creditsMonthly} lesson enhancements/month`}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-foreground">Included:</h4>
                      <ul className="space-y-2">
                        {planDetails.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Limitations */}
                    {planDetails.limitations && planDetails.limitations.length > 0 && (
                      <div className="space-y-3 pt-3 border-t">
                        <h4 className="font-medium text-sm text-muted-foreground">Limitations:</h4>
                        <ul className="space-y-1">
                          {planDetails.limitations.map((limitation, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">
                              • {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA */}
                    <Button 
                      className="w-full"
                      variant={isPopular ? "hero" : "outline"}
                      size="lg"
                      onClick={onRequestAccess}
                      disabled={true}
                    >
                      {isPopular ? (
                        <>
                          <Star className="h-4 w-4" />
                          {cycle === "yearly" ? "Subscribe Yearly" : "Request Access"}
                        </>
                      ) : (
                        cycle === "yearly" ? "Subscribe Yearly" : "Request Access"
                      )}
                    </Button>
                    
                    <p className="text-center text-xs text-muted-foreground">
                      Private beta • Setup included • Cancel anytime
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* FAQ note */}
        <div className="text-center mt-12 space-y-4">
          <h3 className="text-xl font-semibold">Questions about pricing?</h3>
          <p className="text-muted-foreground">
            We're here to help you choose the right plan for your ministry. 
            Contact us for volume discounts and custom enterprise solutions.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline">
              Contact Sales
            </Button>
            <Button variant="ghost">
              View FAQ
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}