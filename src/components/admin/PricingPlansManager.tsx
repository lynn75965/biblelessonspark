import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, RefreshCw, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SubscriptionPlan {
  id: string;
  name: string;
  lookup_key: string;
  price_monthly_cents: number;
  price_yearly_cents: number;
  currency: string;
  credits_monthly: number | null;
  stripe_product_id: string;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
  updated_at: string;
}

export function PricingPlansManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ credits_monthly: string }>({ credits_monthly: "" });

  const { data: plans, isLoading } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_monthly_cents", { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("sync-pricing-from-stripe", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      toast({
        title: "Sync successful",
        description: `Updated ${data.updated?.length || 0} plans from Stripe`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, credits_monthly }: { id: string; credits_monthly: number | null }) => {
      const { error } = await supabase
        .from("subscription_plans")
        .update({ credits_monthly })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
      setEditingPlan(null);
      toast({
        title: "Plan updated",
        description: "Credits updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCents = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const handleSave = (planId: string) => {
    const value = editValues.credits_monthly === "" ? null : parseInt(editValues.credits_monthly);
    updatePlanMutation.mutate({ id: planId, credits_monthly: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pricing & Plans</CardTitle>
          <CardDescription>
            Sync pricing from Stripe and manage subscription plans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm space-y-2">
              <p className="font-semibold">Price Change Workflow:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>In Stripe Dashboard: Create a new Price for the product with the new amount</li>
                <li>Move the canonical lookup_key to the new Price (clear from old, set on new)</li>
                <li>Mark the old Price inactive (optional)</li>
                <li>In LessonSparkUSA Admin: Click "Sync from Stripe"</li>
                <li>Verify new amounts updated, adjust credits if needed</li>
              </ol>
              <p className="text-muted-foreground mt-2">
                Canonical lookup keys: essentials_monthly, essentials_yearly, pro_monthly, pro_yearly, premium_monthly, premium_yearly
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              Sync from Stripe
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://dashboard.stripe.com/test/products"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Stripe Products
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href="https://dashboard.stripe.com/test/settings/billing/portal"
                target="_blank"
                rel="noopener noreferrer"
              >
                Billing Portal Config
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading plans...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Yearly</TableHead>
                  <TableHead>Credits/Month</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>{formatCents(plan.price_monthly_cents, plan.currency)}</TableCell>
                    <TableCell>{formatCents(plan.price_yearly_cents, plan.currency)}</TableCell>
                    <TableCell>
                      {editingPlan === plan.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder="NULL for unlimited"
                            value={editValues.credits_monthly}
                            onChange={(e) => setEditValues({ credits_monthly: e.target.value })}
                            className="w-32"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSave(plan.id)}
                            disabled={updatePlanMutation.isPending}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPlan(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPlan(plan.id);
                            setEditValues({ credits_monthly: plan.credits_monthly?.toString() || "" });
                          }}
                          className="hover:underline"
                        >
                          {plan.credits_monthly === null ? "Unlimited" : plan.credits_monthly}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(plan.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={`https://dashboard.stripe.com/test/products/${plan.stripe_product_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
