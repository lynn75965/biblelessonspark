/**
 * PublicBetaPromptBanner - Dashboard Component
 * 
 * SSOT COMPLIANCE:
 * - TEXT from tenant_config via TenantContext (editable in Admin Panel)
 * - BEHAVIOR from betaEnrollmentConfig.ts (platform logic)
 * - Platform mode check from systemSettings
 * - Public Beta org ID from organizationConfig.ts
 * 
 * PURPOSE:
 * Shows a banner to "orphan" users (no organization) when platform
 * is in public_beta mode, prompting them to join the Public Beta org.
 * 
 * Created: January 1, 2026
 * Updated: January 8, 2026 - Read text from TenantContext instead of static config
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { shouldPromptOrgEnrollment } from '@/constants/betaEnrollmentConfig';
import { PUBLIC_BETA_ORG_ID } from '@/constants/organizationConfig';
import { useTenant } from '@/contexts/TenantContext';

// LocalStorage key for dismissal tracking
const DISMISS_KEY = 'publicBetaPromptDismissedAt';
const DISMISS_DURATION_DAYS = 7;

interface PublicBetaPromptBannerProps {
  userOrgId: string | null;
  onEnrollmentComplete?: () => void;
}

export function PublicBetaPromptBanner({ 
  userOrgId, 
  onEnrollmentComplete 
}: PublicBetaPromptBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const { user } = useAuth();
  const { settings } = useSystemSettings();
  const { toast } = useToast();
  const tenant = useTenant();

  // SSOT: Get TEXT from tenant_config (database)
  const config = tenant.beta.dashboardPrompt;
  const messages = tenant.beta.messages;

  // Check if banner should be shown
  useEffect(() => {
    // Check platform mode and org status (BEHAVIOR from betaEnrollmentConfig)
    const shouldShow = shouldPromptOrgEnrollment(
      settings.current_phase as string,
      userOrgId
    );

    if (!shouldShow) {
      setIsVisible(false);
      return;
    }

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissDate = new Date(dismissedAt);
      const now = new Date();
      const daysSinceDismiss = (now.getTime() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismiss < DISMISS_DURATION_DAYS) {
        setIsVisible(false);
        return;
      }
    }

    setIsVisible(true);
  }, [settings.current_phase, userOrgId]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    setIsVisible(false);
  };

  const handleJoinBeta = async () => {
    if (!user) return;

    setIsEnrolling(true);

    try {
      // Step 1: Add to organization_members
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: PUBLIC_BETA_ORG_ID,
          user_id: user.id,
          role: 'member',
          joined_at: new Date().toISOString(),
        });

      if (memberError) {
        // Check if already a member (unique constraint violation)
        if (memberError.code === '23505') {
          toast({
            title: messages.alreadyEnrolledTitle,
            description: messages.alreadyEnrolledDescription,
          });
          setIsVisible(false);
          return;
        }
        throw memberError;
      }

      // Step 2: Update profile with organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: PUBLIC_BETA_ORG_ID })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Success!
      toast({
        title: messages.enrollmentSuccessTitle,
        description: 'You are now part of the BibleLessonSpark Public Beta!',
      });

      setIsVisible(false);
      onEnrollmentComplete?.();

    } catch (error: any) {
      console.error('Error joining Public Beta:', error);
      toast({
        title: messages.enrollmentErrorTitle,
        description: messages.enrollmentErrorDescription,
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <Card className="mb-6 border-primary/50 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left side: Icon + Text */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shrink-0">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">
                  {config.title}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  Free
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
          </div>

          {/* Right side: Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              {config.dismissButton}
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={handleJoinBeta}
              disabled={isEnrolling}
              className="flex-1 sm:flex-none"
            >
              {isEnrolling ? 'Joining...' : config.button}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
