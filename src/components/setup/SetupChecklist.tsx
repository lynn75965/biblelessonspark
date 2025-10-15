import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle2, 
  Circle,
  User, 
  Church, 
  BookOpen,
  Users,
  Sparkles,
  ArrowRight,
  Mail,
  CreditCard,
  Zap,
  LayoutDashboard,
  UserPlus,
  CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSetupProgress, StepKey } from "@/hooks/useSetupProgress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SetupStep {
  id: StepKey;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void | Promise<void>;
  actionLabel?: string;
  showAction?: boolean;
}

interface SetupChecklistProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function SetupChecklist({ isModal = false, onClose }: SetupChecklistProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, loading, updateStep, refreshProgress, completedCount, totalSteps, progressPercentage } = useSetupProgress();
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingStripe, setVerifyingStripe] = useState(false);

  useEffect(() => {
    console.log("✅ VERIFIED_BUILD: Setup Checklist Interactive loaded", {
      completedCount,
      totalSteps,
      progressPercentage,
      progress
    });
  }, [completedCount, totalSteps, progressPercentage, progress]);

  const steps: SetupStep[] = [
    {
      id: 'create_account',
      title: 'Create your LessonSpark USA account',
      description: 'Sign up and create your teacher profile',
      icon: <User className="h-6 w-6" />,
      action: () => {
        if (!user) navigate('/auth');
      },
      actionLabel: 'Go to Sign In',
      showAction: !user,
    },
    {
      id: 'verify_email',
      title: 'Verify your email',
      description: 'Check your inbox and confirm your email address',
      icon: <Mail className="h-6 w-6" />,
      action: async () => {
        setVerifyingEmail(true);
        try {
          const { data } = await supabase.auth.refreshSession();
          if (data.user?.email_confirmed_at) {
            await updateStep('verify_email', 'complete');
            toast.success('Email verified!');
          } else {
            toast.error('Email not yet verified. Please check your inbox.');
          }
        } catch (error) {
          toast.error('Failed to verify email');
        } finally {
          setVerifyingEmail(false);
        }
      },
      actionLabel: verifyingEmail ? 'Verifying...' : 'Verify',
      showAction: user && progress['verify_email'] !== 'complete',
    },
    {
      id: 'choose_lens',
      title: 'Choose your Theological Lens',
      description: 'Select your preferred Baptist theological perspective',
      icon: <Church className="h-6 w-6" />,
      action: () => navigate('/preferences/lens'),
      actionLabel: 'Choose Lens',
      showAction: progress['choose_lens'] !== 'complete',
    },
    {
      id: 'select_plan',
      title: 'Select your Subscription Plan',
      description: 'Choose the plan that fits your ministry needs',
      icon: <CreditCard className="h-6 w-6" />,
      action: () => {
        // Check if pricing page exists, otherwise navigate to account
        navigate('/account');
      },
      actionLabel: 'Select Plan',
      showAction: progress['select_plan'] !== 'complete',
    },
    {
      id: 'connect_stripe',
      title: 'Connect Stripe (auto-checked if live)',
      description: 'Payment processing setup for subscriptions',
      icon: <Zap className="h-6 w-6" />,
      action: async () => {
        setVerifyingStripe(true);
        try {
          const { data, error } = await supabase.functions.invoke('stripe-status');
          if (error) throw error;
          
          if (data?.connected && data?.live) {
            await updateStep('connect_stripe', 'complete');
            toast.success('Stripe is connected and live!');
          } else {
            toast.error('Stripe is not yet configured');
          }
        } catch (error) {
          toast.error('Failed to verify Stripe status');
        } finally {
          setVerifyingStripe(false);
        }
      },
      actionLabel: verifyingStripe ? 'Verifying...' : 'Verify',
      showAction: progress['connect_stripe'] !== 'complete',
    },
    {
      id: 'generate_lesson',
      title: 'Generate your first lesson',
      description: 'Try creating an enhanced Bible study lesson',
      icon: <BookOpen className="h-6 w-6" />,
      action: () => navigate('/dashboard'),
      actionLabel: 'Create Lesson',
      showAction: progress['generate_lesson'] !== 'complete',
    },
    {
      id: 'review_dashboard',
      title: 'Review your dashboard and credit balance',
      description: 'Familiarize yourself with your workspace',
      icon: <LayoutDashboard className="h-6 w-6" />,
      action: async () => {
        navigate('/dashboard');
        await updateStep('review_dashboard', 'complete');
      },
      actionLabel: 'View Dashboard',
      showAction: progress['review_dashboard'] !== 'complete',
    },
    {
      id: 'invite_teacher',
      title: 'Invite another teacher (optional)',
      description: 'Share LessonSpark with your ministry team',
      icon: <UserPlus className="h-6 w-6" />,
      action: () => navigate('/account'),
      actionLabel: 'Invite Teachers',
      showAction: progress['invite_teacher'] !== 'complete',
    },
    {
      id: 'mark_complete',
      title: 'Mark Setup Complete',
      description: "You're ready to start enhancing lessons!",
      icon: <CheckCheck className="h-6 w-6" />,
      action: async () => {
        await updateStep('mark_complete', 'complete');
        toast.success('Setup complete! Welcome to LessonSpark USA!');
      },
      actionLabel: 'Complete',
      showAction: false,
    },
  ];

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", isModal && "max-h-[80vh] overflow-y-auto")}>
        <Card className="p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-primary shadow-lg mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to LessonSpark USA!</h2>
          <p className="text-muted-foreground mb-6">Please sign in to access your setup checklist and start creating amazing Bible study lessons.</p>
          <Button onClick={() => navigate('/auth')} className="bg-gradient-primary">
            Sign In to Continue
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("w-full max-w-2xl mx-auto", isModal && "max-h-[80vh] overflow-y-auto")}>
        <div className="flex items-center justify-center py-12">
          <BookOpen className="h-8 w-8 animate-pulse text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-2xl mx-auto", isModal && "max-h-[80vh] overflow-y-auto")}>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-primary shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">Welcome to LessonSpark USA!</h2>
              <p className="text-lg text-muted-foreground">Let's get you started with these simple steps!</p>
            </div>
          </div>
          
          {/* Progress */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span>Setup Progress</span>
              <span className="text-primary">{completedCount} of {totalSteps} complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-primary h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => {
            const isComplete = progress[step.id] === 'complete';
            
            return (
              <Card key={step.id} className={cn(
                "border-2 transition-all duration-300 hover:shadow-md",
                isComplete 
                  ? "border-success bg-success/5" 
                  : "border-border hover:border-primary/30"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Step Icon/Number */}
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300",
                      isComplete 
                        ? "bg-success text-white" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {isComplete ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    
                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                          <p className="text-muted-foreground text-sm">{step.description}</p>
                        </div>
                        {!isComplete && step.showAction && (
                          <Button
                            onClick={step.action}
                            size="sm"
                            className="whitespace-nowrap shrink-0"
                            variant="default"
                          >
                            {step.actionLabel}
                            {!verifyingEmail && !verifyingStripe && <ArrowRight className="ml-2 h-4 w-4" />}
                          </Button>
                        )}
                        {isComplete && (
                          <div className="flex items-center gap-2 text-success font-medium text-sm shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Completion Message */}
        {progress['mark_complete'] === 'complete' && (
          <Card className="border-success bg-gradient-to-r from-success/10 to-primary/10">
            <CardContent className="p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-white mx-auto mb-3">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Congratulations! 🎉
              </h3>
              <p className="text-muted-foreground mb-4">
                You're all set to start creating amazing Baptist Bible study lessons!
              </p>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-primary"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        {isModal && (
          <div className="flex items-center justify-between pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={onClose}
              className="bg-gradient-primary hover:bg-gradient-primary/90"
            >
              Start Creating Lessons
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}