import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  BillingCycle, 
  UiPlan, 
  getPlans, 
  formatMoney, 
  monthlyEquivalentFromYearly,
  getPlanFeatures 
} from "@/lib/pricingSource";

export function PricingSection() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [plans, setPlans] = useState<UiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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

  const handleSubscribe = async (lookupKey: string, planId: string) => {
    setCheckoutLoading(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to subscribe");
        window.location.href = "/auth";
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { lookup_key: lookupKey }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to create checkout session. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("essential")) return <Zap className="h-5 w-5" />;
    if (name.includes("pro")) return <Star className="h-5 w-5" />;
    if (name.includes("premium")) return <Crown className="h-5 w-5" />;
    return <Star className="h-5 w-5" />;
  };

  return (
    <section id="pricing" className="py-10 sm:py-16 lg:py-20">
      <div className="container px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12 lg:mb-16">
          <Badge variant="outline" className="px-3 py-1 text-xs sm:text-sm">
            Pricing
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Simple, Transparent{" "}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Choose the plan that works best for you
          </p>

          {/* Billing cycle toggle */}
          <div className="inline-flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6 lg:mt-8 rounded-full border-2 border-border bg-card px-1.5 sm:px-2 py-1 sm:py-1.5 shadow-sm w-auto max-w-full">
            <button
              onClick={() => setCycle("monthly")}
              className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 min-h-[36px] sm:min-h-[40px] ${
                cycle === "monthly" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              aria-pressed={cycle === "monthly"}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 min-h-[36px] sm:min-h-[40px] ${
                cycle === "yearly" 
                  ? "bg-gradient-to-r from-secondary to-warning text-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              aria-pressed={cycle === "yearly"}
            >
              Yearly <span className="ml-0.5 sm:ml-1 text-[10px] sm:text-xs opacity-90 font-semibold whitespace-nowrap">(save 20%)</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm sm:text-base text-muted-foreground mt-3 sm:mt-4">Loading pricing plans…</p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 sm:py-16 lg:py-20 px-4">
            <p className="text-sm sm:text-base text-muted-foreground">No pricing plans available. Please contact support.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const planDetails = getPlanFeatures(plan.name);
              const showYearlyHelper = cycle === "yearly";
              const monthlyEq = showYearlyHelper ? monthlyEquivalentFromYearly(plan.priceCents) : null;
              const isPopular = plan.bestValue && cycle === "yearly";
              const isPro = plan.name.toLowerCase().includes("pro");

              return (
                <Card 
                  key={plan.id}
                  className={`relative overflow-hidden transition-all duration-300 ${
                    isPopular 
                      ? "border-[#C9A341] border-2 shadow-xl md:scale-[1.05] bg-gradient-to-br from-white via-[#C9A341]/5 to-white dark:from-card dark:via-[#C9A341]/10 dark:to-card" 
                      : "border-border hover:border-primary/30 hover:shadow-lg bg-gradient-card"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-0 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-[#C9A341] to-[#E5C478] text-white px-3 sm:px-4 lg:px-5 py-1 sm:py-1.5 rounded-b-lg text-xs sm:text-sm font-semibold shadow-md">
                        Best Value
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className={`text-center px-4 sm:px-6 ${isPopular ? "pt-8 sm:pt-10" : "pt-4 sm:pt-6"}`}>
                    <CardTitle className="text-lg sm:text-xl font-semibold mb-1">{plan.name}</CardTitle>
                    
                    <div className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      {plan.creditsMonthly === null 
                        ? "Unlimited credits/month" 
                        : `${plan.creditsMonthly} credits/month`}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={`font-bold ${isPopular ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl sm:text-3xl lg:text-4xl"}`}>
                          {formatMoney(plan.priceCents, plan.currency.toUpperCase())}
                        </span>
                        <span className="text-muted-foreground text-xs sm:text-sm">
                          {cycle === "yearly" ? "/year" : "/month"}
                        </span>
                      </div>
                      {showYearlyHelper && monthlyEq !== null && (
                        <p className="text-xs sm:text-sm text-muted-foreground font-medium px-2">
                          That's just {formatMoney(monthlyEq, plan.currency.toUpperCase())}/month — save 20% annually
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 sm:space-y-6 pt-2 px-4 sm:px-6 pb-4 sm:pb-6">
                    {/* Features */}
                    <div className="space-y-2 sm:space-y-3">
                      <ul className="space-y-2">
                        {planDetails.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-success shrink-0 mt-0.5" />
                            <span className="text-foreground/80">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA */}
                    <Button 
                      className={`w-full min-h-[44px] text-sm sm:text-base ${
                        isPopular 
                          ? "bg-gradient-to-r from-[#C9A341] to-[#E5C478] text-white hover:from-[#B89237] hover:to-[#C9A341] shadow-lg" 
                          : ""
                      }`}
                      variant={isPopular ? "default" : "outline"}
                      size="lg"
                      onClick={() => handleSubscribe(plan.lookupKey, plan.id)}
                      disabled={checkoutLoading === plan.id}
                    >
                      {checkoutLoading === plan.id ? (
                        <>
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="ml-2">Processing...</span>
                        </>
                      ) : (
                        <span>{cycle === "yearly" ? "Subscribe Yearly" : "Subscribe Monthly"}</span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}