// ============================================================
// BibleLessonSpark - USAGE DISPLAY COMPONENT
// Location: src/components/subscription/UsageDisplay.tsx
// ============================================================

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle, Calendar, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { usePricingPlans } from '@/hooks/usePricingPlans';

interface UsageDisplayProps {
  onUpgradeClick?: () => void;
  compact?: boolean;
}

export function UsageDisplay({ onUpgradeClick, compact = false }: UsageDisplayProps) {
  const {
    tier,
    lessonsUsed,
    lessonsLimit,
    lessonsRemaining,
    usagePercentage,
    resetDate,
    isFreeTier,
    isLoading,
  } = useSubscription();

  const { freePlan, personalPlan } = usePricingPlans();

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-lg p-4">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  const planName = tier === 'free' ? (freePlan?.planName || 'Free') : (personalPlan?.planName || 'Personal');
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = lessonsRemaining <= 0;

  const formatResetDate = () => {
    if (!resetDate) return 'soon';
    const now = new Date();
    const diffDays = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'tomorrow';
    if (diffDays <= 7) return `in ${diffDays} days`;
    return resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge 
          variant={isFreeTier ? "secondary" : "default"}
          className={isFreeTier ? "bg-gray-100" : "bg-sky-100 text-sky-700"}
        >
          {planName}
        </Badge>
        <span className={`text-sm ${isAtLimit ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
          {lessonsUsed}/{lessonsLimit}
        </span>
        {isAtLimit && isFreeTier && onUpgradeClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUpgradeClick}
            className="text-sky-600 hover:text-sky-700 p-1 h-auto"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${
      isAtLimit ? 'border-red-200 bg-red-50' : 
      isNearLimit ? 'border-amber-200 bg-amber-50' : 
      'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge 
            variant={isFreeTier ? "secondary" : "default"}
            className={isFreeTier ? "bg-gray-100" : "bg-sky-100 text-sky-700"}
          >
            {planName} Plan
          </Badge>
          {!isFreeTier && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Zap className="h-3 w-3 mr-1" />
              8 sections
            </Badge>
          )}
        </div>
        {isFreeTier && onUpgradeClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUpgradeClick}
            className="text-sky-600 hover:text-sky-700"
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Upgrade
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className={isAtLimit ? 'text-red-700 font-medium' : 'text-gray-600'}>
            {lessonsUsed} of {lessonsLimit} lessons used
          </span>
          <span className="text-gray-500">
            {lessonsRemaining > 0 ? `${lessonsRemaining} remaining` : 'Limit reached'}
          </span>
        </div>
        <Progress 
          value={usagePercentage} 
          className={`h-2 ${
            isAtLimit ? '[&>div]:bg-red-500' : 
            isNearLimit ? '[&>div]:bg-amber-500' : 
            '[&>div]:bg-sky-500'
          }`}
        />
      </div>

      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
        <Calendar className="h-3 w-3" />
        <span>Resets {formatResetDate()}</span>
      </div>

      {isAtLimit && isFreeTier && (
        <div className="mt-3 p-3 bg-white rounded-md border border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-red-700 font-medium">
                You have reached your monthly limit
              </p>
              <p className="text-gray-600 mt-1">
                Upgrade to {personalPlan?.planName || 'Personal'} for {personalPlan?.lessonsPerMonth || 20} lessons/month 
                and access to all 8 lesson sections.
              </p>
              {onUpgradeClick && (
                <Button
                  onClick={onUpgradeClick}
                  size="sm"
                  className="mt-2 bg-sky-600 hover:bg-sky-700"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Upgrade Now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {isNearLimit && !isAtLimit && isFreeTier && (
        <div className="mt-3 p-2 bg-amber-100 rounded-md">
          <p className="text-xs text-amber-800">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Running low on lessons. Consider upgrading for more capacity.
          </p>
        </div>
      )}

      {isFreeTier && !isAtLimit && !isNearLimit && (
        <div className="mt-3 p-2 bg-sky-50 rounded-md">
          <p className="text-xs text-sky-700">
            <Sparkles className="h-3 w-3 inline mr-1" />
            Upgrade to Personal for complete 8-section lessons with Theological Background, 
            Activities, and Discussion guides.
          </p>
        </div>
      )}
    </div>
  );
}
