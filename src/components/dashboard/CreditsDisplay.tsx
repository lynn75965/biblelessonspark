import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CreditsDisplayProps {
  balance: number;
  loading: boolean;
}

export function CreditsDisplay({ balance, loading }: CreditsDisplayProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Your Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Your Credits
        </CardTitle>
        <CardDescription>Available lesson generation credits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-4xl font-bold">{balance}</div>
        {balance === 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              You're out of credits. Upgrade your plan to continue.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Plus className="mr-2 h-4 w-4" />
              View Plans
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
