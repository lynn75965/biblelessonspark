import { useState } from "react";
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
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  navigateTo?: string;
  actionLabel?: string;
}

interface SetupChecklistProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function SetupChecklist({ isModal = false, onClose }: SetupChecklistProps) {
  const navigate = useNavigate();
  
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'account',
      title: 'Set up your teacher account',
      description: 'Create your personal account and sign in',
      icon: <User className="h-6 w-6" />,
      completed: false,
      navigateTo: '/auth',
      actionLabel: 'Go to Sign In'
    },
    {
      id: 'church',
      title: 'Add your church information',
      description: 'Tell us about your church and ministry',
      icon: <Church className="h-6 w-6" />,
      completed: false,
      navigateTo: '/account',
      actionLabel: 'Go to Profile'
    },
    {
      id: 'lesson',
      title: 'Create your first lesson',
      description: 'Try our smart lesson enhancement',
      icon: <BookOpen className="h-6 w-6" />,
      completed: false,
      navigateTo: '/dashboard',
      actionLabel: 'Go to Dashboard'
    },
    {
      id: 'invite',
      title: 'Invite other teachers (optional)',
      description: 'Share LessonSpark with your ministry team',
      icon: <Users className="h-6 w-6" />,
      completed: false,
      navigateTo: '/account',
      actionLabel: 'Go to Account'
    },
    {
      id: 'ready',
      title: 'You\'re ready to go!',
      description: 'Start enhancing lessons for your Baptist Bible study',
      icon: <Sparkles className="h-6 w-6" />,
      completed: false,
      navigateTo: '/dashboard',
      actionLabel: 'Go to Dashboard'
    }
  ]);

  const handleStepComplete = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, completed: true }
        : step
    ));
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

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
              <span className="text-primary">{completedSteps} of {totalSteps} complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="bg-gradient-primary h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card key={step.id} className={cn(
              "border-2 transition-all duration-300 hover:shadow-md",
              step.completed 
                ? "border-success bg-success/5" 
                : "border-border hover:border-primary/30"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Step Icon/Number */}
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300",
                    step.completed 
                      ? "bg-success text-white" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {step.completed ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-1">{step.title}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{step.description}</p>
                        {step.navigateTo && !step.completed && (
                          <p className="text-xs text-muted-foreground/70">
                            Click below to open this step
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {!step.completed && step.navigateTo && (
                          <Button
                            onClick={() => navigate(step.navigateTo!)}
                            size="sm"
                            variant="outline"
                            className="whitespace-nowrap"
                          >
                            {step.actionLabel}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                        {!step.completed && (
                          <Button
                            onClick={() => handleStepComplete(step.id)}
                            size="sm"
                            className="whitespace-nowrap"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completion Message */}
        {completedSteps === totalSteps && (
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