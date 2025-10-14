import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PricingCardProps {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  credits: number | null;
  onSubscribe: (interval: "monthly" | "yearly") => void;
  loading?: boolean;
}

export function PricingCard({ 
  name, 
  monthlyPrice, 
  yearlyPrice, 
  credits, 
  onSubscribe,
  loading 
}: PricingCardProps) {
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          {credits === null ? "Unlimited" : credits} credits/month
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatPrice(monthlyPrice)}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <Button 
            onClick={() => onSubscribe("monthly")}
            disabled={loading}
            className="w-full"
          >
            Subscribe Monthly
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatPrice(yearlyPrice)}</span>
            <span className="text-muted-foreground">/year</span>
          </div>
          <Button 
            onClick={() => onSubscribe("yearly")}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Subscribe Yearly
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>Enhanced lessons</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>Customizable content</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary" />
            <span>Priority support</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
