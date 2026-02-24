// ============================================================
// BibleLessonSpark - SUBSCRIPTION MANAGEMENT COMPONENT
// Location: src/components/subscription/SubscriptionManagement.tsx
// ============================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, Sparkles, ExternalLink } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { formatPrice } from '@/constants/pricingConfig';

export function SubscriptionManagement() {
  const {
    tier,
    status,
    lessonsUsed,
    lessonsLimit,
    resetDate,
    billingInterval,
    openCustomerPortal,
    isLoading,
  } = useSubscription();
  
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const url = await openCustomerPortal();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setIsPortalLoading(false);
    }
  };

  const formatResetDate = () => {
    if (!resetDate) return 'N/A';
    return resetDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTierDisplay = () => {
    if (tier === 'personal') return 'Personal';
    return 'Free';
  };

  const getStatusBadge = () => {
    if (status === 'active') {
      return <Badge className="bg-primary">Active</Badge>;
    }
    if (status === 'past_due') {
      return <Badge className="bg-red-500">Past Due</Badge>;
    }
    if (status === 'canceled') {
      return <Badge className="bg-muted-foreground">Canceled</Badge>;
    }
    return <Badge className="bg-muted-foreground">{status || 'Free'}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Plan */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-lg font-semibold flex items-center gap-2">
              {tier === 'personal' && <Sparkles className="h-4 w-4 text-amber-500" />}
              {getTierDisplay()}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Usage */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Lessons This Period</p>
          <p className="text-lg font-semibold">
            {lessonsUsed} of {lessonsLimit} used
          </p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all"
              style={{ width: `${Math.min((lessonsUsed / lessonsLimit) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Reset Date */}
        {resetDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Resets on {formatResetDate()}</span>
          </div>
        )}

        {/* Billing Interval */}
        {tier === 'personal' && billingInterval && (
          <div className="text-sm text-muted-foreground">
            Billed {billingInterval === 'year' ? 'annually' : 'monthly'}
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t space-y-2">
          {tier === 'personal' ? (
            <Button 
              onClick={handleManageSubscription}
              disabled={isPortalLoading}
              className="w-full"
              variant="outline"
            >
              {isPortalLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Subscription
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={() => window.location.href = '/pricing'}
              className="w-full bg-sky-600 hover:bg-sky-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to Personal
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
