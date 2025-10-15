import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type StepKey = 
  | 'create_account'
  | 'verify_email'
  | 'choose_lens'
  | 'select_plan'
  | 'connect_stripe'
  | 'generate_lesson'
  | 'review_dashboard'
  | 'invite_teacher'
  | 'mark_complete';

export type StepStatus = 'not_started' | 'in_progress' | 'complete';

interface SetupProgress {
  [key: string]: StepStatus;
}

export function useSetupProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<SetupProgress>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgress();
      checkAutoCompletions();
    }
  }, [user]);

  async function loadProgress() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('setup_progress')
        .select('step_key, status')
        .eq('user_id', user.id);

      if (error) throw error;

      const progressMap: SetupProgress = {};
      data?.forEach(item => {
        progressMap[item.step_key] = item.status as StepStatus;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Error loading setup progress:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkAutoCompletions() {
    if (!user) return;

    // Check if account is created (always true if logged in)
    await updateStep('create_account', 'complete');

    // Check if email is verified
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.email_confirmed_at) {
      await updateStep('verify_email', 'complete');
    }

    // Check if theological lens is set
    const { data: profile } = await supabase
      .from('profiles')
      .select('theological_preference')
      .eq('id', user.id)
      .single();
    
    if (profile?.theological_preference) {
      await updateStep('choose_lens', 'complete');
    }

    // Check if subscription plan exists
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (subscription) {
      await updateStep('select_plan', 'complete');
    }

    // Check if any lesson exists
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (lessons && lessons.length > 0) {
      await updateStep('generate_lesson', 'complete');
    }

    // Check if any invite sent
    const { data: invites } = await supabase
      .from('invites')
      .select('token')
      .eq('created_by', user.id)
      .limit(1);
    
    if (invites && invites.length > 0) {
      await updateStep('invite_teacher', 'complete');
    }
  }

  async function updateStep(stepKey: StepKey, status: StepStatus) {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('setup_progress')
        .upsert({
          user_id: user.id,
          step_key: stepKey,
          status,
          completed_at: status === 'complete' ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id,step_key'
        });

      if (error) throw error;

      setProgress(prev => ({ ...prev, [stepKey]: status }));

      // Check if all steps are complete
      if (status === 'complete') {
        await checkAllComplete();
      }
    } catch (error) {
      console.error('Error updating setup progress:', error);
    }
  }

  async function checkAllComplete() {
    const requiredSteps: StepKey[] = [
      'create_account',
      'verify_email',
      'choose_lens',
      'select_plan',
      'connect_stripe',
      'generate_lesson',
      'review_dashboard',
      'invite_teacher',
    ];

    const allComplete = requiredSteps.every(key => progress[key] === 'complete');
    
    if (allComplete) {
      await updateStep('mark_complete', 'complete');
    }
  }

  const completedCount = Object.values(progress).filter(s => s === 'complete').length;
  const totalSteps = 9;
  const progressPercentage = Math.round((completedCount / totalSteps) * 100);

  return {
    progress,
    loading,
    updateStep,
    refreshProgress: loadProgress,
    completedCount,
    totalSteps,
    progressPercentage,
  };
}
