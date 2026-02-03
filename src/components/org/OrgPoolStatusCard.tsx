/**
 * OrgPoolStatusCard Component
 * 
 * Displays organization lesson pool status with:
 * - Subscription tier and status
 * - Pool usage progress bar (subscription + bonus)
 * - Period reset countdown
 * - Purchase buttons for lesson packs
 * - Upgrade subscription button
 * 
 * SSOT: Pool data from organizations table, configs from org_tier_config/lesson_pack_config
 * 
 * @location src/components/org/OrgPoolStatusCard.tsx
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Layers, 
  TrendingUp, 
  Calendar, 
  Package, 
  CreditCard, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useOrgPoolStatus,
  getTierDisplayName,
  getStatusBadgeVariant,
  getStatusLabel,
  formatCurrency,
  type LessonPackConfig,
  type OrgTierConfig,
} from "@/hooks/useOrgPoolStatus";

// ============================================================================
// TYPES
// ============================================================================

interface OrgPoolStatusCardProps {
  organizationId: string;
  organizationName: string;
  /** If true, shows purchase options. Only for org leaders. */
  showPurchaseOptions?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OrgPoolStatusCard({
  organizationId,
  organizationName,
  showPurchaseOptions = false,
}: OrgPoolStatusCardProps) {
  const { toast } = useToast();
  const { poolStatus, tierConfigs, lessonPackConfigs, loading, error, refetch } = useOrgPoolStatus(organizationId);
  
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // ============================================================================
  // PURCHASE HANDLERS
  // ============================================================================

  const handlePurchasePack = async (pack: LessonPackConfig) => {
    setPurchaseLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-lesson-pack", {
        body: {
          organization_id: organizationId,
          pack_type: pack.packType,
        },
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Error initiating pack purchase:", err);
      toast({
        title: "Purchase Failed",
        description: err.message || "Failed to initiate purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleUpgradeSubscription = async (tier: OrgTierConfig, interval: 'month' | 'year') => {
    setPurchaseLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-org-checkout-session", {
        body: {
          organization_id: organizationId,
          tier: tier.tier,
          billing_interval: interval === 'year' ? 'annual' : 'monthly',
        },
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Error initiating subscription:", err);
      toast({
        title: "Subscription Failed",
        description: err.message || "Failed to initiate subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-primary";
  };

  const getUsageIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (percentage >= 70) return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle2 className="h-4 w-4 text-primary" />;
  };

  // ============================================================================
  // LOADING / ERROR STATES
  // ============================================================================

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4 text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading pool status...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // NO SUBSCRIPTION STATE
  // ============================================================================

  if (!poolStatus?.subscriptionTier) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            Lesson Pool
          </CardTitle>
          <CardDescription>
            No active subscription for {organizationName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Start a subscription to provide lessons for your team.
            </p>
            {showPurchaseOptions && (
              <Button onClick={() => setUpgradeDialogOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Choose a Plan
              </Button>
            )}
          </div>

          {/* Bonus lessons display (can have bonus without subscription) */}
          {poolStatus && poolStatus.bonusLessons > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Bonus Lessons</span>
                <Badge variant="secondary">{poolStatus.bonusLessons} available</Badge>
              </div>
            </div>
          )}
        </CardContent>

        {/* Upgrade Dialog */}
        <SubscriptionDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          tierConfigs={tierConfigs}
          currentTier={null}
          onSelectTier={handleUpgradeSubscription}
          loading={purchaseLoading}
        />
      </Card>
    );
  }

  // ============================================================================
  // ACTIVE SUBSCRIPTION STATE
  // ============================================================================

  const tierName = getTierDisplayName(poolStatus.subscriptionTier, tierConfigs);
  const statusVariant = getStatusBadgeVariant(poolStatus.subscriptionStatus);
  const statusLabel = getStatusLabel(poolStatus.subscriptionStatus);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Lesson Pool
            </CardTitle>
            <CardDescription>
              {tierName} • {organizationName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pool Usage Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getUsageIcon(poolStatus.usagePercentage)}
              <span className="font-medium">Subscription Pool</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {poolStatus.lessonsUsedThisPeriod} / {poolStatus.lessonsLimit} used
            </span>
          </div>
          
          <Progress 
            value={poolStatus.usagePercentage} 
            className="h-3"
          />

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {poolStatus.subscriptionRemaining} remaining this period
            </span>
            {poolStatus.daysUntilReset !== null && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Resets in {poolStatus.daysUntilReset} days
              </span>
            )}
          </div>
        </div>

        {/* Bonus Lessons Section */}
        {poolStatus.bonusLessons > 0 && (
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-secondary" />
              <span className="font-medium">Bonus Lessons</span>
            </div>
            <Badge variant="secondary">{poolStatus.bonusLessons} available</Badge>
          </div>
        )}

        {/* Total Available */}
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
          <span className="font-medium">Total Available</span>
          <span className="text-2xl font-bold text-primary">
            {poolStatus.totalAvailable}
          </span>
        </div>

        {/* Warning if running low */}
        {poolStatus.usagePercentage >= 80 && (
          <Alert variant={poolStatus.usagePercentage >= 90 ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {poolStatus.usagePercentage >= 90
                ? "Pool nearly exhausted! Purchase more lessons to avoid interruption."
                : "Pool running low. Consider purchasing additional lessons."}
            </AlertDescription>
          </Alert>
        )}

        {/* Purchase Options */}
        {showPurchaseOptions && (
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setPurchaseDialogOpen(true)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy Lesson Pack
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setUpgradeDialogOpen(true)}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        )}
      </CardContent>

      {/* Purchase Pack Dialog */}
      <LessonPackDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        lessonPackConfigs={lessonPackConfigs}
        onPurchase={handlePurchasePack}
        loading={purchaseLoading}
      />

      {/* Upgrade Subscription Dialog */}
      <SubscriptionDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        tierConfigs={tierConfigs}
        currentTier={poolStatus.subscriptionTier}
        onSelectTier={handleUpgradeSubscription}
        loading={purchaseLoading}
      />
    </Card>
  );
}

// ============================================================================
// LESSON PACK PURCHASE DIALOG
// ============================================================================

interface LessonPackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonPackConfigs: LessonPackConfig[];
  onPurchase: (pack: LessonPackConfig) => void;
  loading: boolean;
}

function LessonPackDialog({
  open,
  onOpenChange,
  lessonPackConfigs,
  onPurchase,
  loading,
}: LessonPackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Purchase Lesson Pack
          </DialogTitle>
          <DialogDescription>
            Add bonus lessons to your pool. These never expire and are used after your subscription pool is exhausted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {lessonPackConfigs.map((pack) => (
            <div
              key={pack.packType}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div>
                <p className="font-medium">{pack.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {pack.lessonsIncluded} lessons • {pack.description}
                </p>
              </div>
              <Button
                onClick={() => onPurchase(pack)}
                disabled={loading}
                size="sm"
              >
                {formatCurrency(pack.price)}
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// SUBSCRIPTION UPGRADE DIALOG
// ============================================================================

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tierConfigs: OrgTierConfig[];
  currentTier: string | null;
  onSelectTier: (tier: OrgTierConfig, interval: 'month' | 'year') => void;
  loading: boolean;
}

function SubscriptionDialog({
  open,
  onOpenChange,
  tierConfigs,
  currentTier,
  onSelectTier,
  loading,
}: SubscriptionDialogProps) {
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('year');

  // Filter to show only tiers higher than current
  const availableTiers = currentTier
    ? tierConfigs.filter((t) => {
        const currentConfig = tierConfigs.find((c) => c.tier === currentTier);
        return currentConfig ? t.lessonsLimit > currentConfig.lessonsLimit : true;
      })
    : tierConfigs;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {currentTier ? "Upgrade Subscription" : "Choose a Plan"}
          </DialogTitle>
          <DialogDescription>
            Select a plan that fits your ministry's needs. Annual plans save 2 months.
          </DialogDescription>
        </DialogHeader>

        {/* Billing Interval Toggle */}
        <div className="flex justify-center gap-2 py-2">
          <Button
            variant={selectedInterval === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedInterval('month')}
          >
            Monthly
          </Button>
          <Button
            variant={selectedInterval === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedInterval('year')}
          >
            Annual (Save 17%)
          </Button>
        </div>

        <div className="space-y-3 py-4">
          {availableTiers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              You're on the highest tier available.
            </p>
          ) : (
            availableTiers.map((tier) => (
              <div
                key={tier.tier}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{tier.displayName}</p>
                    {tier.tier === currentTier && (
                      <Badge variant="outline">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tier.lessonsLimit} lessons/month • {tier.bestFor}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-bold">
                      {formatCurrency(selectedInterval === 'year' ? tier.priceAnnual : tier.priceMonthly)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      /{selectedInterval === 'year' ? 'year' : 'month'}
                    </p>
                  </div>
                  <Button
                    onClick={() => onSelectTier(tier, selectedInterval)}
                    disabled={loading || tier.tier === currentTier}
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    {tier.tier === currentTier ? 'Current' : 'Select'}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
