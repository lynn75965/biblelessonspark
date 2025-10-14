import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Zap } from "lucide-react";

interface PricingSectionProps {
  onRequestAccess?: () => void;
}

export function PricingSection({ onRequestAccess }: PricingSectionProps) {
  const plans = [
    {
      name: "Essentials",
      price: "$19",
      period: "/month",
      description: "Perfect for individual teachers and small Sunday School classes",
      icon: <Zap className="h-5 w-5" />,
      popular: false,
      features: [
        "50 lesson enhancements per month",
        "All age groups (Kids, Youth, Adults, Seniors)",
        "SBC, RB, IND doctrinal profiles",
        "Print & PDF export",
        "Email support",
        "Basic lesson library"
      ],
      limitations: [
        "Single user account",
        "Basic customization options"
      ]
    },
    {
      name: "Pro",
      price: "$49", 
      period: "/month",
      description: "Ideal for churches with multiple teachers and growing programs",
      icon: <Star className="h-5 w-5" />,
      popular: true,
      features: [
        "200 lesson enhancements per month", 
        "Up to 10 teacher accounts",
        "Advanced lesson customization",
        "Lesson sharing & collaboration",
        "Organization branding",
        "Priority email support",
        "Advanced lesson library",
        "Usage analytics & insights",
        "Bulk lesson export"
      ],
      limitations: []
    },
    {
      name: "Premium",
      price: "$99",
      period: "/month", 
      description: "Comprehensive solution for large churches and multi-campus ministries",
      icon: <Crown className="h-5 w-5" />,
      popular: false,
      features: [
        "Unlimited lesson enhancements",
        "Unlimited teacher accounts",
        "Custom doctrinal profiles",
        "White-label branding",
        "API access for integrations",
        "Phone & priority support",
        "Advanced analytics dashboard",
        "Custom training & onboarding",
        "Multi-campus management",
        "Advanced role permissions"
      ],
      limitations: []
    }
  ];

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
          
          {/* Beta notice */}
          <div className="bg-secondary-light border border-secondary/20 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-secondary-foreground font-medium">
              🎉 Private Beta Special: All plans include 30-day free trial and setup assistance
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative overflow-hidden transition-all duration-normal hover:shadow-glow ${
                plan.popular 
                  ? "border-primary scale-105 shadow-lg bg-gradient-card" 
                  : "border-border hover:border-primary/20 bg-gradient-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-0 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-b-lg">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className={`text-center ${plan.popular ? "pt-8" : "pt-6"}`}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    plan.popular ? "bg-gradient-primary" : "bg-muted"
                  }`}>
                    <div className={plan.popular ? "text-white" : "text-muted-foreground"}>
                      {plan.icon}
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-foreground">Included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="font-medium text-sm text-muted-foreground">Limitations:</h4>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation, idx) => (
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
                  variant={plan.popular ? "hero" : "outline"}
                  size="lg"
                  onClick={onRequestAccess}
                  disabled={true}
                >
                  {plan.popular ? (
                    <>
                      <Star className="h-4 w-4" />
                      Request Access
                    </>
                  ) : (
                    "Request Access"
                  )}
                </Button>
                
                <p className="text-center text-xs text-muted-foreground">
                  Private beta • Setup included • Cancel anytime
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

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