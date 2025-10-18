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
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">{name}</CardTitle>
        <CardDescription className="text-sm">
          {credits === null ? "Unlimited" : credits} credits/month
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 sm:gap-4 p-4 sm:p-6">
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold">{formatPrice(monthlyPrice)}</span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          <Button 
            onClick={() => onSubscribe("monthly")}
            disabled={loading}
            className="w-full text-sm sm:text-base"
            size="lg"
          >
            Subscribe Monthly
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold">{formatPrice(yearlyPrice)}</span>
            <span className="text-muted-foreground text-sm">/year</span>
          </div>
          <Button 
            onClick={() => onSubscribe("yearly")}
            disabled={loading}
            variant="outline"
            className="w-full text-sm sm:text-base"
            size="lg"
          >
            Subscribe Yearly
          </Button>
        </div>

        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
            <span>Enhanced lessons</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
            <span>Customizable content</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
            <span>Priority support</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
